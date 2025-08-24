import mongoose from "mongoose";
const AreaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String
}, { timestamps: true });
export default mongoose.model("Area", AreaSchema);
