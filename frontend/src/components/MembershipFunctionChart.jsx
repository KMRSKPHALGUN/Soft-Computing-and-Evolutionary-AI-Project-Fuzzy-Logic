import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

function generatePoints(set, range = [0, 100], step = 1) {
  const points = [];
  const [min, max] = range;

  for (let x = min; x <= max; x += step) {
    let y = 0;
    const params = set.params.map(Number); // ensure numeric

    switch (set.type) {
      case "tri": {
        const [a, b, c] = params;
        if (x <= a || x >= c) y = 0;
        else if (x === b) y = 1;
        else if (x > a && x < b) y = (x - a) / (b - a);
        else if (x > b && x < c) y = (c - x) / (c - b);
        break;
      }

      case "trap": {
        const [a, b, c, d] = params;
        if (x <= a || x >= d) y = 0;
        else if (x >= b && x <= c) y = 1;
        else if (x > a && x < b) y = (x - a) / (b - a);
        else if (x > c && x < d) y = (d - x) / (d - c);
        break;
      }

      case "zmf": {
        const [a, b] = params;
        if (x <= a) y = 1;
        else if (x >= b) y = 0;
        else if (x < (a + b) / 2)
          y = 1 - 2 * Math.pow((x - a) / (b - a), 2);
        else
          y = 2 * Math.pow((b - x) / (b - a), 2);
        break;
      }

      case "smf": {
        const [a, b] = params;
        if (x <= a) y = 0;
        else if (x >= b) y = 1;
        else if (x < (a + b) / 2)
          y = 2 * Math.pow((x - a) / (b - a), 2);
        else
          y = 1 - 2 * Math.pow((b - x) / (b - a), 2);
        break;
      }

      case "gauss": {
        const [c, sigma] = params;
        y = Math.exp(-0.5 * Math.pow((x - c) / sigma, 2));
        break;
      }

      case "gbell": {
        const [a, b, c] = params;
        y = 1 / (1 + Math.pow(Math.abs((x - c) / a), 2 * b));
        break;
      }

      case "sigmoid": {
        const [a, c] = params;
        y = 1 / (1 + Math.exp(-a * (x - c)));
        break;
      }

      default:
        y = 0;
    }

    points.push({ x, [set.name]: y });
  }

  return points;
}

export default function MembershipFunctionChart({ term }) {
  if (!term.sets || term.sets.length === 0) return null;

  // Merge points from all sets into one dataset
  let data = [];
  term.sets.forEach(set => {
    const pts = generatePoints(set, [term.universe.min, term.universe.max], 1);
    pts.forEach((p, i) => {
      if (!data[i]) data[i] = { x: p.x };
      data[i][set.name] = p[set.name];
    });
  });

  return (
    <div style={{ marginTop: 12 }}>
      <h4>{term.name} Membership Functions</h4>
      <LineChart width={500} height={250} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis domain={[0,1]} />
        <Tooltip />
        <Legend />
        {term.sets.map((set, i) => (
            <Line
                key={set.name}
                type="linear"
                dataKey={set.name}
                strokeWidth={2}
                stroke={["#ff4d4f", "#40a9ff", "#73d13d", "#9254de", "#faad14"][i % 5]}
                dot={false}
            />
        ))}
      </LineChart>
    </div>
  );
}