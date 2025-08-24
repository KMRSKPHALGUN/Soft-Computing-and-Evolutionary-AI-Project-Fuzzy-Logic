import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import areaRoutes from "./routes/areas.js";
import termRoutes from "./routes/terms.js";
import ruleRoutes from "./routes/rules.js";
import evalRoutes from "./routes/evaluate.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/areas", areaRoutes);
app.use("/api/terms", termRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/evaluate", evalRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI || "mongodb://localhost:27017/fuzzy_dss")
  .then(() => app.listen(PORT, () => console.log(`🚀 backend on ${PORT}`)))
  .catch(err => { console.error("DB error", err); process.exit(1); });
