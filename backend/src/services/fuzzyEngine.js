// Fuzzy inference engine implementing fuzzification, rule evaluation with Zadeh operators,
// && centroid defuzzification, mapped from the referenced paper's approach.

// Membership functions
function mfTri(x, [a,b,c]) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
}
function mfTrap(x, [a,b,c,d]) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
}
function degreeForSet(x, set) {
  const p = set.params;
  switch (set.type) {
    case "tri": {
      const [a, b, c] = p;
      if (x <= a || x >= c) return 0;
      else if (x === b) return 1;
      else if (x > a && x < b) return (x - a) / (b - a);
      else if (x > b && x < c) return (c - x) / (c - b);
      break;
    }
    case "trap": {
      const [a, b, c, d] = p;
      if (x <= a || x >= d) return 0;
      else if (x >= b && x <= c) return 1;
      else if (x > a && x < b) return (x - a) / (b - a);
      else if (x > c && x < d) return (d - x) / (d - c);
      break;
    }
    case "gauss": {
      const [c, sigma] = p;
      return Math.exp(-0.5 * Math.pow((x - c) / sigma, 2));
      break;
    }
    case "gbell": {
      const [a, b, c] = p;
      return 1 / (1 + Math.pow(Math.abs((x - c) / a), 2 * b));
      break;
    }
    case "sigmoid": {
      const [a, c] = p;
      return 1 / (1 + Math.exp(-a * (x - c)));
      break;
    }
    case "zmf": {
      const [a, b] = p;
      if (x <= a) return 1;
      else if (x >= b) return 0;
      else if (x < (a + b) / 2)
        return 1 - 2 * Math.pow((x - a) / (b - a), 2);
      else
        return 2 * Math.pow((b - x) / (b - a), 2);
      break;
    }

    case "smf": {
      const [a, b] = p;
      if (x <= a) return 0;
      else if (x >= b) return 1;
      else if (x < (a + b) / 2)
        return 2 * Math.pow((x - a) / (b - a), 2);
      else
        return 1 - 2 * Math.pow((b - x) / (b - a), 2);
      break;
    }
    default:
      return 0;
  }
}

// Zadeh operators
const AND = (x,y) => Math.min(x,y);
const OR  = (x,y) => Math.max(x,y);
const NOT = (x)   => 1 - x;

// centroid of fuzzy set (approx via polygon centroid or params average as proxy)
function centroidOfSet(set) {
  const p = set.params;
  switch (set.type) {
    case "tri": {
      const [a, b, c] = p;
      return (a + b + c) / 3;
    }
    case "trap": {
      const [a, b, c, d] = p;
      return (a + b + c + d) / 4;
    }
    case "gauss": {
      const [c, sigma] = p;
      return c; // Gaussian is symmetric around c
    }
    case "gbell": {
      const [a, b, c] = p;
      return c; // symmetric around center c
    }
    case "sigmoid": {
      const [a, c] = p;
      return c; // inflection point
    }
    case "zmf": {
      const [a, b] = p;
      return (a + b) / 2; // midpoint of transition
    }
    case "smf": {
      const [a, b] = p;
      return (a + b) / 2; // midpoint of transition
    }
    default:
      return 0; // safe fallback
  }
}


export function evaluate(areaTerms, areaRules, crispInputs) {
  // Build term map for quick lookup
  const termById = new Map(areaTerms.map(t => [String(t._id), t]));
  const termByName = new Map(areaTerms.map(t => [t.name, t]));

  // Fuzzification: compute μ for all input terms' sets given crisp input
  const mu = {}; // mu[termId][setName] = degree
  for (const t of areaTerms) {
    mu[String(t._id)] = {};
    const x = crispInputs[t.name];
    for (const s of t.sets) {
      let deg = 0;
      if (t.kind === "input") {
        if (x === undefined) { deg = 0; } else { deg = degreeForSet(x, s); }
      } else {
        // outputs are not fuzzified from input; will be filled by inference aggregation
        deg = 0;
      }
      mu[String(t._id)][s.name] = deg;
    }
  }

  // Rule evaluation
  const fired = []; // { thenTermId, thenSet, strength }
  for (const r of areaRules) {
    let strength = 0;
    for (let i=0; i<r.if.length; i++) {
      const p = r.if[i];
      const deg = mu[String(p.term)]?.[p.setName] ?? 0;
      if (i === 0) {
        strength = deg;
      } else {
        strength = (r.if[i-1].opToNext === "OR") ? OR(strength, deg) : AND(strength, deg);
      }
    }
    strength = Math.max(0, Math.min(1, strength * (r.weight ?? 1)));
    for (const action of r.then) {  // r.then is now an array of {term, setName}
      fired.push({ thenTermId: String(action.term), thenSet: action.setName, strength });
    }

  }

  const outAgg = {};
  for (const f of fired) {
    outAgg[f.thenTermId] = outAgg[f.thenTermId] || {};
    outAgg[f.thenTermId][f.thenSet] = Math.max(outAgg[f.thenTermId][f.thenSet] || 0, f.strength);
  }

  // Defuzzification per output term
  const crispOutputs = {};
  const namedOutAgg = {};
  for (const [termId, setsMap] of Object.entries(outAgg)) {
    const term = termById.get(termId);
    if (!term) continue;
    
    // build crisp outputs
    let num = 0, den = 0;
    for (const [setName, strength] of Object.entries(setsMap)) {
      const set = term.sets.find(s => s.name === setName);
      if (!set) continue;
      const c = centroidOfSet(set);
      num += strength * c;
      den += strength;
    }
    crispOutputs[term.name] = den === 0 ? 0 : num / den;

    // build fuzzy outputs with names
    namedOutAgg[term.name] = setsMap;
  }

  // Final return
  return { mu, fired, outAgg: namedOutAgg, crispOutputs };
}