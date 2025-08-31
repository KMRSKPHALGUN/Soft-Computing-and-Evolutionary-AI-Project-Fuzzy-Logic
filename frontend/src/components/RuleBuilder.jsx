import React, { useEffect, useState } from "react";
import api from "../api";

export default function RuleBuilder({ area }) {
  const [terms, setTerms] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [rules, setRules] = useState([]);

  const [premises, setPremises] = useState([]);
  const [thens, setThens] = useState([]); // array of THEN actions

  async function load() {
    const { data } = await api.get("/terms", { params: { area: area._id } });
    setTerms(data);
    setInputs(data.filter(t => t.kind === "input"));
    setOutputs(data.filter(t => t.kind === "output"));

    // Load rules and normalize 'then' to always be an array
    const r = await api.get("/rules", { params: { area: area._id } });
    const normalized = (r.data || []).map(rule => {
      // If rule.then is already an array, keep it. If it's an object, wrap it.
      const thenField = rule.then;
      const thenArr = Array.isArray(thenField) ? thenField : (thenField ? [thenField] : []);
      return { ...rule, then: thenArr };
    });
    setRules(normalized);
  }

  useEffect(() => { load(); }, [area._id]);

  function addPremise() {
    setPremises(p => [...p, { term: "", setName: "", opToNext: "END" }]);
  }

  function addThen() {
    setThens(p => [...p, { term: "", setName: "" }]);
  }

  async function saveRule() {
    if (premises.length === 0 || thens.length === 0) return;
    // Validate: ensure terms chosen
    const validPrem = premises.every(p => p.term && p.setName);
    const validThens = thens.every(t => t.term && t.setName);
    if (!validPrem || !validThens) {
      alert("Please fill all IF and THEN fields before saving.");
      return;
    }

    const body = {
      area: area._id,
      if: premises.map(p => ({ term: p.term, setName: p.setName, opToNext: p.opToNext })),
      then: thens.map(t => ({ term: t.term, setName: t.setName })) // array of actions
    };
    await api.post("/rules", body);
    setPremises([]);
    setThens([]);
    load();
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <h2>Rules (IF–THEN with Zadeh Operators)</h2>

      <div style={{ marginBottom: 8 }}>
        <button onClick={addPremise}>Add IF clause</button>
      </div>

      {premises.map((p, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <select value={p.term} onChange={e=>{
            const v = e.target.value;
            setPremises(arr => arr.map((x,i)=> i===idx? {...x, term:v, setName:""}:x));
          }}>
            <option value="">-- choose term --</option>
            {inputs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>

          <select value={p.setName} onChange={e=>{
            const v = e.target.value;
            setPremises(arr => arr.map((x,i)=> i===idx? {...x, setName:v}:x));
          }}>
            <option value="">-- choose set --</option>
            {terms.find(t=>t._id===p.term)?.sets?.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>

          <select value={p.opToNext} onChange={e=>{
            const v = e.target.value;
            setPremises(arr => arr.map((x,i)=> i===idx? {...x, opToNext:v}:x));
          }}>
            <option value="END">END</option>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <button onClick={addThen}>Add THEN action</button>
      </div>

      {thens.map((t, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <select value={t.term} onChange={e=>{
            const v = e.target.value;
            setThens(arr => arr.map((x,i)=> i===idx? {...x, term:v, setName:""}:x));
          }}>
            <option value="">-- choose output term --</option>
            {outputs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </select>

          <select value={t.setName} onChange={e=>{
            const v = e.target.value;
            setThens(arr => arr.map((x,i)=> i===idx? {...x, setName:v}:x));
          }}>
            <option value="">-- choose set --</option>
            {terms.find(term=>term._id===t.term)?.sets?.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      ))}

      <div style={{ marginTop: 10 }}>
        <button onClick={saveRule}>Save Rule</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <b>Existing rules:</b>
        <ul>
          {rules.map(r => (
            <li key={r._id}>
              IF { (r.if || []).map((p,i) => {
                const termName = terms.find(t=>t._id===p.term)?.name || "(unknown)";
                const op = p.opToNext && p.opToNext !== "END" ? ` ${p.opToNext}` : "";
                return `${termName} IS ${p.setName}${op}`;
              }).join(" ")}
              {" "}THEN{" "}
              { (Array.isArray(r.then) ? r.then : []).map((tn, i) => {
                const outName = terms.find(t=>t._id===tn.term)?.name || "(unknown)";
                return `${outName} IS ${tn.setName}`;
              }).join(" AND ") }
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}