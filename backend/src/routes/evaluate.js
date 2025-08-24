import express from "express";
import Area from "../models/Area.js";
import Term from "../models/Term.js";
import Rule from "../models/Rule.js";
import { evaluate } from "../services/fuzzyEngine.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { areaId, inputs } = req.body;
    const area = await Area.findById(areaId);
    if (!area) return res.status(404).json({ error: "Area not found" });

    const terms = await Term.find({ area: areaId }).lean();
    const rules = await Rule.find({ area: areaId }).lean();

    const result = evaluate(terms, rules, inputs);
    res.json({ area: area.name, inputs, ...result });
  } catch (e) { next(e); }
});

export default router;
