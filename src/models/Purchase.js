import mongoose from "mongoose";

const PurchaseItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["processing", "completed", "cancelled"],
      default: "processing",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    items: { type: [PurchaseItemSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PurchaseSchema.index({ vendorId: 1, createdAt: -1 });

export const Purchase = mongoose.model("Purchase", PurchaseSchema);
