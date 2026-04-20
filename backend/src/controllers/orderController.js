import mongoose from "mongoose";
import { Request } from "../models/Request.js";
import { sendError } from "../utils/http.js";
import { serializeRequest } from "../utils/serializers.js";

async function populateRequest(request) {
  await request.populate("customerId");
  await request.populate("vendorId");
  return request;
}

export async function listOrders(req, res) {
  const baseFilter = req.user.role === "vendor" ? { vendorId: req.user._id } : { customerId: req.user._id };
  const orders = await Request.find({ ...baseFilter, type: "order" })
    .populate("customerId")
    .populate("vendorId")
    .sort({ createdAt: -1 });

  return res.json({ orders: orders.map(serializeRequest) });
}

export async function getOrder(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid order id");

  const baseFilter = req.user.role === "vendor" ? { vendorId: req.user._id } : { customerId: req.user._id };
  const order = await Request.findOne({ ...baseFilter, _id: id, type: "order" });
  if (!order) return sendError(res, 404, "Order not found");

  await populateRequest(order);
  return res.json({ order: serializeRequest(order) });
}

