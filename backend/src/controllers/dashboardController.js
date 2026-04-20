import { Chat } from "../models/Chat.js";
import { Product } from "../models/Product.js";
import { Purchase } from "../models/Purchase.js";
import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import { serializeChat, serializeProduct, serializePurchase, serializeRequest, serializeUser } from "../utils/serializers.js";

export async function getCustomerDashboard(req, res) {
  const [requests, purchases, chats, vendors] = await Promise.all([
    Request.find({ customerId: req.user._id }).populate("customerId").populate("vendorId").sort({ createdAt: -1 }).limit(8),
    Purchase.find({ customerId: req.user._id }).populate("customerId").populate("vendorId").sort({ createdAt: -1 }).limit(8),
    Chat.find({ customerId: req.user._id }).populate("customerId").populate("vendorId").populate("messages.senderId").sort({ lastMessageAt: -1 }).limit(8),
    User.find({ role: "vendor" }).sort({ "vendorProfile.rating": -1, createdAt: -1 }).limit(6),
  ]);

  return res.json({
    summary: {
      activeRequests: requests.filter((item) => ["pending", "accepted"].includes(item.status)).length,
      purchases: purchases.length,
      chats: chats.length,
    },
    requests: requests.map(serializeRequest),
    purchases: purchases.map(serializePurchase),
    chats: chats.map((chat) => serializeChat(chat, req.user._id)),
    recommendedVendors: vendors.map(serializeUser),
  });
}

export async function getVendorDashboard(req, res) {
  const [requests, purchases, chats, products] = await Promise.all([
    Request.find({ vendorId: req.user._id }).populate("customerId").populate("vendorId").sort({ createdAt: -1 }).limit(10),
    Purchase.find({ vendorId: req.user._id }).populate("customerId").populate("vendorId").sort({ createdAt: -1 }),
    Chat.find({ vendorId: req.user._id }).populate("customerId").populate("vendorId").populate("messages.senderId").sort({ lastMessageAt: -1 }).limit(8),
    Product.find({ vendorId: req.user._id }).sort({ createdAt: -1 }).limit(8),
  ]);

  const revenue = purchases
    .filter((purchase) => purchase.status === "completed")
    .reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);

  return res.json({
    summary: {
      pendingRequests: requests.filter((item) => item.status === "pending").length,
      totalProducts: products.length,
      activeChats: chats.length,
      revenue,
    },
    requests: requests.map(serializeRequest),
    purchases: purchases.map(serializePurchase),
    chats: chats.map((chat) => serializeChat(chat, req.user._id)),
    products: products.map(serializeProduct),
  });
}
