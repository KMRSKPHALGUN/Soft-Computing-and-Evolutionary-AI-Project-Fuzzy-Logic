import express from "express";
import Rule from "../models/Rule.js";
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const rule = await Rule.create(req.body);
    res.json(rule);
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const { area } = req.query;
    const filter = area ? { area } : {};
    const list = await Rule.find(filter).lean();
    res.json(list);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
