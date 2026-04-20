import mongoose from "mongoose";

const VendorContactSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

VendorContactSchema.index({ vendorId: 1, isPrimary: -1, createdAt: -1 });

export const VendorContact = mongoose.model("VendorContact", VendorContactSchema);
