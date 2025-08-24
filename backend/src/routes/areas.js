import express from "express";
import Area from "../models/Area.js";
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const area = await Area.create(req.body);
    res.json(area);
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const list = await Area.find().lean();
    res.json(list);
  } catch (e) { next(e); }
});

export default router;
