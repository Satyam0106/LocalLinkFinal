import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";
import { serializeUser } from "../utils/serializers.js";
import { cleanString, isValidEmail, normalizeEmail, normalizePhone } from "../utils/validation.js";

function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, { subject: String(userId), expiresIn: "7d" });
}

function buildUserPayload(body = {}) {
  const role = body.role;
  const location = cleanString(body.location);
  const phone = normalizePhone(body.phone);

  return {
    name: cleanString(body.name),
    email: normalizeEmail(body.email),
    role,
    profile: {
      location,
      phone,
      bio: cleanString(body.bio),
      avatarUrl: cleanString(body.avatarUrl),
    },
    customerProfile: {
      preferredCategories: Array.isArray(body.preferredCategories)
        ? body.preferredCategories.map((item) => cleanString(item)).filter(Boolean)
        : [],
      defaultAddress: cleanString(body.defaultAddress),
    },
    vendorProfile:
      role === "vendor"
        ? {
            businessName: cleanString(body.businessName || body.name),
            category: cleanString(body.category),
            description: cleanString(body.description),
            rating: 4.5,
            serviceAreas: Array.isArray(body.serviceAreas)
              ? body.serviceAreas.map((item) => cleanString(item)).filter(Boolean)
              : location
                ? [location]
                : [],
            contacts: phone
              ? [
                  {
                    label: "Primary",
                    phone,
                    email: normalizeEmail(body.email),
                    isPrimary: true,
                  },
                ]
              : [],
          }
        : {},
  };
}

export async function signup(req, res) {
  const { name, email, password, role, category, location, phone } = req.body ?? {};
  if (!name || !email || !password || !role) {
    return sendError(res, 400, "Missing required fields", {
      required: ["name", "email", "password", "role"],
    });
  }
  if (!["customer", "vendor"].includes(role)) return sendError(res, 400, "Invalid role");
  if (role === "vendor" && (!category || !location || !phone)) {
    return sendError(res, 400, "Missing vendor fields", { required: ["category", "location", "phone"] });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return sendError(res, 400, "Please provide a valid email address.");
  }
  if (role === "vendor" && normalizedPhone.length < 7) {
    return sendError(res, 400, "Please provide a valid phone number for vendors.");
  }

  const existing = await User.findOne({ email: normalizedEmail }).select("_id").lean();
  if (existing) {
    return sendError(
      res,
      409,
      "An account with this email already exists. Try logging in or use a different email.",
      { email: normalizedEmail }
    );
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  let user;
  try {
    user = await User.create({
      ...buildUserPayload(req.body),
      passwordHash,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return sendError(
        res,
        409,
        `An account with the email "${normalizedEmail}" already exists. Try logging in.`,
        { email: normalizedEmail }
      );
    }
    throw err;
  }

  const token = signToken(user._id);
  return res.status(201).json({
    token,
    user: serializeUser(user),
  });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return sendError(res, 400, "Missing email or password");

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return sendError(res, 400, "Please provide a valid email address.");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return sendError(res, 401, "Invalid credentials");

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return sendError(res, 401, "Invalid credentials");

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  return res.json({
    token,
    user: serializeUser(user),
  });
}

export async function me(req, res) {
  return res.json({ user: serializeUser(req.user) });
}
