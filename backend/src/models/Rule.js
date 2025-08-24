import mongoose from "mongoose";

const PremiseSchema = new mongoose.Schema({
  term: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
  setName: { type: String, required: true },
  opToNext: { type: String, enum: ["AND", "OR", "END"], default: "END" } // chain operator
}, { _id: false });

const ThenSchema = new mongoose.Schema({
  term: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
  setName: { type: String, required: true }
}, { _id: false });

const RuleSchema = new mongoose.Schema({
  area: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true },
  if: [PremiseSchema],
  then: ThenSchema,
  weight: { type: Number, default: 1.0 } // optional rule weight
}, { timestamps: true });

export default mongoose.model("Rule", RuleSchema);
