import mongoose from "mongoose";

export function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

export function normalizePhone(value) {
  return String(value ?? "").trim();
}

export function ensureObjectId(value) {
  return mongoose.isValidObjectId(value);
}

export function cleanString(value, fallback = "") {
  return String(value ?? fallback).trim();
}
