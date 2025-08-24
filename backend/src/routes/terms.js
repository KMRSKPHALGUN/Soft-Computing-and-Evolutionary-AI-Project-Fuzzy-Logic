import express from "express";
import Term from "../models/Term.js";
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const term = await Term.create(req.body);
    res.json(term);
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const { area } = req.query;
    const filter = area ? { area } : {};
    const list = await Term.find(filter).lean();
    res.json(list);
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const term = await Term.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(term);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Term.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
