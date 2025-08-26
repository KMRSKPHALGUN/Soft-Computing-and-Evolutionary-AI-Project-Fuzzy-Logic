import React, { useEffect, useState } from "react";
import MembershipFunctionChart from "./MembershipFunctionChart";
import api from "../api";

export default function TermEditor({ area }) {
  const [terms, setTerms] = useState([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("input");
  const [universe, setUniverse] = useState({ min: 0, max: 100 });
  const [setNameStr, setSetNameStr] = useState("");
  const [setParams, setSetParams] = useState("0,50,100");
  const [setType, setSetType] = useState("tri");

  async function load() {
    const { data } = await api.get("/terms", { params: { area: area._id } });
    setTerms(data);
  }
  useEffect(() => { load(); }, [area._id]);

  async function addTerm() {
    await api.post("/terms", {
      area: area._id,
      name, kind,
      universe,
      sets: []
    });
    setName("");
    load();
  }

  async function addSet(term) {
    const sets = [...term.sets, { name: setNameStr, type: setType, params: setParams.split(",").map(v=>Number(v.trim())) }];
    await api.put(`/terms/${term._id}`, { ...term, sets });
    setSetNameStr(""); setSetParams("0,50,100");
    load();
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <h2>Terms (Variables & Membership Functions)</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input placeholder="Term name (e.g., Temperature)" value={name} onChange={e=>setName(e.target.value)} />
        <select value={kind} onChange={e=>setKind(e.target.value)}>
          <option value="input">Input</option>
          <option value="output">Output</option>
        </select>
        <input style={{ width: 100 }} placeholder="min" value={universe.min} onChange={e=>setUniverse(v=>({...v, min:Number(e.target.value)}))} />
        <input style={{ width: 100 }} placeholder="max" value={universe.max} onChange={e=>setUniverse(v=>({...v, max:Number(e.target.value)}))} />
        <button onClick={addTerm}>Add Term</button>
      </div>

      {terms.map(t => (
        <div key={t._id} style={{ border: "1px dashed #ccc", padding: 8, borderRadius: 6, marginTop: 8 }}>
          <b>{t.name}</b> ({t.kind}) — sets: {t.sets.map(s => `${s.name} (${s.params.join(", ")})`).join(", ") || "none"}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input placeholder="Set name (e.g., Cold)" value={setNameStr} onChange={e=>setSetNameStr(e.target.value)} />
            <select value={setType} onChange={e=>setSetType(e.target.value)}>
              <option value="tri">Triangular [a,b,c]</option>
              <option value="trap">Trapezoidal [a,b,c,d]</option>
              <option value="gauss">Gaussian [c, sigma]</option>
              <option value="gbell">Generalized Bell [a, b, c]</option>
              <option value="sigmoid">Sigmoid [a, b]</option>
              <option value="zmf">Z-shape (ZMF) [a, b]</option>
              <option value="smf">S-shape (SMF) [a, b]</option>
            </select>
            <input style={{ width: 220 }} placeholder="params comma sep" value={setParams} onChange={e=>setSetParams(e.target.value)} />
            <button onClick={()=>addSet(t)}>Add Set</button>
          </div>
          <MembershipFunctionChart term={t} />
        </div>
      ))}
    </div>
  );
}
