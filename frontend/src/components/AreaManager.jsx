import React, { useState } from "react";
import api from "../api";

export default function AreaManager({ areas, onCreated, activeArea, onSelect }) {
  const [name, setName] = useState("Demo Area");
  const [desc, setDesc] = useState("");

  async function createArea() {
    await api.post("/areas", { name, description: desc });
    setName(""); setDesc(""); onCreated();
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <h2>Areas</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {areas.map(a => (
          <button key={a._id} onClick={() => onSelect(a)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: activeArea?._id===a._id? "#eee":"#fafafa" }}>
            {a.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Area name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <button onClick={createArea}>Create</button>
      </div>
    </div>
  );
}
