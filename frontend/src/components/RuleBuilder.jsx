import React, { useEffect, useState } from "react";
import api from "../api";

export default function RuleBuilder({ area }) {
  const [terms, setTerms] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [rules, setRules] = useState([]);

  const [premises, setPremises] = useState([]);
  const [thenTerm, setThenTerm] = useState("");
  const [thenSet, setThenSet] = useState("");

  async function load() {
    const { data } = await api.get("/terms", { params: { area: area._id } });
    setTerms(data);
    setInputs(data.filter(t=>t.kind==="input"));
    setOutputs(data.filter(t=>t.kind==="output"));
    const r = await api.get("/rules", { params: { area: area._id } });
    setRules(r.data);
  }
  useEffect(() => { load(); }, [area._id]);

  function addPremise() {
    setPremises(p => [...p, { term: "", setName: "", opToNext: "END" }]);
  }
  async function saveRule() {
    if (!thenTerm || !thenSet || premises.length===0) return;
    const body = {
      area: area._id,
      if: premises.map(p => ({ term: p.term, setName: p.setName, opToNext: p.opToNext })),
      then: { term: thenTerm, setName: thenSet }
    };
    await api.post("/rules", body);
    setPremises([]); setThenTerm(""); setThenSet("");
    load();
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <h2>Rules (IF–THEN with Zadeh Operators)</h2>

      <button onClick={addPremise}>Add IF clause</button>
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
            {terms.find(t=>t._id===p.term)?.sets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
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

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        THEN
        <select value={thenTerm} onChange={e=>setThenTerm(e.target.value)}>
          <option value="">-- choose output term --</option>
          {outputs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={thenSet} onChange={e=>setThenSet(e.target.value)}>
          <option value="">-- choose set --</option>
          {terms.find(t=>t._id===thenTerm)?.sets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <button onClick={saveRule}>Save Rule</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <b>Existing rules:</b>
        <ul>
          {rules.map(r => (
            <li key={r._id}>
              IF {r.if.map((p,i)=>`${terms.find(t=>t._id===p.term)?.name} IS ${p.setName} ${p.opToNext!=="END"?p.opToNext:""}`).join(" ")}
              THEN {terms.find(t=>t._id===r.then.term)?.name} IS {r.then.setName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
