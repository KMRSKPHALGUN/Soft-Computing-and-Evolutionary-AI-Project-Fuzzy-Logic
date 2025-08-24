import mongoose from "mongoose";

const SetSchema = new mongoose.Schema({
  name: { type: String, required: true },           // e.g., "Cold"
  type: { type: String, enum: ["tri", "trap"], default: "tri" },
  params: { type: [Number], required: true }        // tri: [a,b,c] trap: [a,b,c,d]
}, { _id: false });

const TermSchema = new mongoose.Schema({
  area: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true },
  name: { type: String, required: true },           // e.g., "Temperature"
  kind: { type: String, enum: ["input", "output"], required: true },
  universe: { min: Number, max: Number },           // optional bounds for UI
  sets: [SetSchema]
}, { timestamps: true });

TermSchema.index({ area: 1, name: 1 }, { unique: true });

export default mongoose.model("Term", TermSchema);
