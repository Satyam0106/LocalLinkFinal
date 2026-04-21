import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { VendorContact } from "../models/VendorContact.js";
import { sendError } from "../utils/http.js";
import { serializeProduct, serializeUser, serializeVendorContact } from "../utils/serializers.js";

async function getVendorPayload(id) {
  const vendor = await User.findOne({ _id: id, role: "vendor" });
  if (!vendor) return null;

  const [products, contacts] = await Promise.all([
    Product.find({ vendorId: vendor._id, status: { $ne: "archived" } }).sort({ createdAt: -1 }),
    VendorContact.find({ vendorId: vendor._id }).sort({ isPrimary: -1, createdAt: -1 }),
  ]);

  return {
    ...serializeUser(vendor),
    products: products.map(serializeProduct),
    contacts: contacts.map(serializeVendorContact),
  };
}

export async function listVendors(req, res) {
  const query = String(req.query.q ?? "").trim();
  const category = String(req.query.category ?? "").trim();

  const filter = { role: "vendor" };
  if (query) {
    const pattern = new RegExp(query, "i");
    filter.$or = [
      { name: pattern },
      { "vendorProfile.businessName": pattern },
      { "vendorProfile.category": pattern },
      { "profile.location": pattern },
    ];
  }
  if (category && category !== "All categories") {
    filter["vendorProfile.category"] = category;
  }

  const vendors = await User.find(filter).sort({ "vendorProfile.rating": -1, createdAt: -1 });
  return res.json({
    vendors: vendors.map(serializeUser),
  });
}

export async function getVendor(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid vendor id");

  const vendor = await getVendorPayload(id);
  if (!vendor) return sendError(res, 404, "Vendor not found");

  return res.json({ vendor });
}
