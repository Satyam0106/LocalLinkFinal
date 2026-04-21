import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: "" },
    kind: { type: String, enum: ["product", "service"], default: "product" },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active", index: true },
    inventoryCount: { type: Number, min: 0, default: 0 },
    tags: { type: [String], default: [] },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ vendorId: 1, category: 1, createdAt: -1 });

export const Product = mongoose.model("Product", ProductSchema);
