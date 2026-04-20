import { Purchase } from "../models/Purchase.js";
import { sendError } from "../utils/http.js";
import { serializePurchase } from "../utils/serializers.js";

export async function listPurchases(req, res) {
  const filter = req.user.role === "vendor" ? { vendorId: req.user._id } : { customerId: req.user._id };
  const purchases = await Purchase.find(filter).populate("customerId").populate("vendorId").sort({ createdAt: -1 });
  return res.json({ purchases: purchases.map(serializePurchase) });
}

export async function updatePurchaseStatus(req, res) {
  if (req.user.role !== "vendor") return sendError(res, 403, "Forbidden");

  const purchase = await Purchase.findOne({ _id: req.params.id, vendorId: req.user._id }).populate("customerId").populate("vendorId");
  if (!purchase) return sendError(res, 404, "Purchase not found");

  const allowedStatuses = ["processing", "completed", "cancelled"];
  if (!allowedStatuses.includes(req.body?.status)) {
    return sendError(res, 400, `Allowed statuses: ${allowedStatuses.join(", ")}`);
  }

  purchase.status = req.body.status;
  purchase.completedAt = req.body.status === "completed" ? new Date() : purchase.completedAt;
  await purchase.save();

  return res.json({ purchase: serializePurchase(purchase) });
}
