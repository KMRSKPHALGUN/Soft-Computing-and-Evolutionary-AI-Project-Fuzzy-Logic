import React, { useEffect, useState } from "react";
import api from "../api";

export default function Evaluate({ area }) {
  const [terms, setTerms] = useState([]);
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);

  async function load() {
    const { data } = await api.get("/terms", { params: { area: area._id } });
    setTerms(data);
  }
  useEffect(() => { load(); setResult(null); setInputs({}); }, [area._id]);

  async function evaluate() {
    const { data } = await api.post("/evaluate", { areaId: area._id, inputs });
    setResult(data);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <h2>Evaluate (Crisp → Fuzzy → Crisp)</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {terms.filter(t=>t.kind==="input").map(t => (
          <div key={t._id}>
            <label>{t.name}</label><br/>
            <input type="number" value={inputs[t.name] ?? ""} onChange={e=>setInputs(v=>({...v, [t.name]: Number(e.target.value)}))} />
          </div>
        ))}
      </div>
      <button style={{ marginTop: 8 }} onClick={evaluate}>Run</button>

      {result && (
        <div style={{ marginTop: 12 }}>
          <div><b>Inputs:</b> {JSON.stringify(result.inputs)}</div>
          <div><b>Outputs (crisp):</b> {JSON.stringify(result.crispOutputs)}</div>
        </div>
      )}
    </div>
  );
}
