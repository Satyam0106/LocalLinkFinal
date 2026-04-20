import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { sendError } from "../utils/http.js";
import { serializeProduct } from "../utils/serializers.js";
import { cleanString } from "../utils/validation.js";

function buildProductPayload(body = {}) {
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => cleanString(tag)).filter(Boolean)
    : cleanString(body.tags)
      .split(",")
      .map((tag) => cleanString(tag))
      .filter(Boolean);

  return {
    name: cleanString(body.name),
    price: Number(body.price),
    description: cleanString(body.description),
    category: cleanString(body.category),
    kind: body.kind === "service" ? "service" : "product",
    status: ["active", "draft", "archived"].includes(body.status) ? body.status : "active",
    inventoryCount: Number.isFinite(Number(body.inventoryCount)) ? Number(body.inventoryCount) : 0,
    tags,
  };
}

function validateProductInput(payload) {
  if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0) {
    return "Valid name and price are required.";
  }
  if (!Number.isInteger(payload.inventoryCount) || payload.inventoryCount < 0) {
    return "Inventory count must be a whole number of 0 or more.";
  }
  return "";
}

export async function listProducts(req, res) {
  const filter = {};
  if (req.query.vendorId && mongoose.isValidObjectId(req.query.vendorId)) {
    filter.vendorId = req.query.vendorId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.kind) {
    filter.kind = req.query.kind;
  }
  if (req.query.q) {
    const pattern = new RegExp(String(req.query.q).trim(), "i");
    filter.$or = [{ name: pattern }, { description: pattern }, { category: pattern }, { tags: pattern }];
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  return res.json({ products: products.map(serializeProduct) });
}

export async function getProductsByVendor(req, res) {
  const { vendorId } = req.params;
  const filter = { vendorId };
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const products = await Product.find(filter).sort({ createdAt: -1 });
  return res.json({
    products: products.map(serializeProduct),
  });
}

export async function getProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) return sendError(res, 404, "Product not found");
  return res.json({ product: serializeProduct(product) });
}

export async function createProduct(req, res) {
  const payload = buildProductPayload(req.body);
  const message = validateProductInput(payload);
  if (message) return sendError(res, 400, message);

  const product = await Product.create({
    ...payload,
    vendorId: req.user._id,
  });

  return res.status(201).json({
    product: serializeProduct(product),
  });
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid product id");

  const product = await Product.findOne({ _id: id, vendorId: req.user._id });
  if (!product) return sendError(res, 404, "Product not found");

  const payload = buildProductPayload(req.body);
  const message = validateProductInput(payload);
  if (message) return sendError(res, 400, message);

  Object.assign(product, payload);
  await product.save();

  return res.json({
    product: serializeProduct(product),
  });
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid product id");

  const product = await Product.findOne({ _id: id, vendorId: req.user._id });
  if (!product) return sendError(res, 404, "Product not found");

  await product.deleteOne();
  return res.status(204).send();
}
