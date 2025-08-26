import React, { useEffect, useState } from "react";
import api from "./api";
import AreaManager from "./components/AreaManager";
import TermEditor from "./components/TermEditor";
import RuleBuilder from "./components/RuleBuilder";
import Evaluate from "./components/Evaluate";

export default function App() {
  const [areas, setAreas] = useState([]);
  const [activeArea, setActiveArea] = useState(null);

  async function loadAreas() {
    const { data } = await api.get("/areas");
    setAreas(data);
    if (!activeArea && data.length) setActiveArea(data[0]);
  }
  useEffect(() => { loadAreas(); }, []);

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>Fuzzy DSS</h1>
      <AreaManager areas={areas} onCreated={loadAreas} activeArea={activeArea} onSelect={setActiveArea} />

      {activeArea && (
        <>
          <TermEditor area={activeArea} />
          <RuleBuilder area={activeArea} />
          <Evaluate area={activeArea} />
        </>
      )}
    </div>
  );
}
