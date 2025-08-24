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
  if (set.type === "trap") return mfTrap(x, set.params);
  return mfTri(x, set.params);
}

// Zadeh operators
const AND = (x,y) => Math.min(x,y);
const OR  = (x,y) => Math.max(x,y);
const NOT = (x)   => 1 - x;

// centroid of fuzzy set (approx via polygon centroid or params average as proxy)
function centroidOfSet(set) {
  const p = set.params;
  if (set.type === "trap") {
    // approx centroid for trapezoid: average of vertices on x-axis weighted by plateau
    const [a,b,c,d] = p;
    return (a + b + c + d) / 4;
  } else {
    const [a,b,c] = p;
    return (a + b + c) / 3;
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
    fired.push({ thenTermId: String(r.then.term), thenSet: r.then.setName, strength });
  }

  // Aggregation on outputs (max per set)
  const outAgg = {}; // outAgg[termId][setName] = μ
  for (const f of fired) {
    outAgg[f.thenTermId] = outAgg[f.thenTermId] || {};
    outAgg[f.thenTermId][f.thenSet] = Math.max(outAgg[f.thenTermId][f.thenSet] || 0, f.strength);
  }

  // Defuzzification per output term (weighted centroid of activated sets)
  const crispOutputs = {};
  for (const [termId, setsMap] of Object.entries(outAgg)) {
    const term = termById.get(termId);
    if (!term) continue;
    let num = 0, den = 0;
    for (const [setName, strength] of Object.entries(setsMap)) {
      const set = term.sets.find(s => s.name === setName);
      if (!set) continue;
      const c = centroidOfSet(set);
      num += strength * c;
      den += strength;
    }
    crispOutputs[term.name] = den === 0 ? 0 : num / den;
  }

  return { mu, fired, crispOutputs };
}
