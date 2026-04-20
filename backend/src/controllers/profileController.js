import { VendorContact } from "../models/VendorContact.js";
import { sendError } from "../utils/http.js";
import { serializeUser, serializeVendorContact } from "../utils/serializers.js";
import { cleanString, isValidEmail, normalizeEmail, normalizePhone } from "../utils/validation.js";

export async function getMyProfile(req, res) {
  const contacts = req.user.role === "vendor"
    ? await VendorContact.find({ vendorId: req.user._id }).sort({ isPrimary: -1, createdAt: -1 })
    : [];

  return res.json({
    user: serializeUser(req.user),
    contacts: contacts.map(serializeVendorContact),
  });
}

export async function updateMyProfile(req, res) {
  const user = req.user;
  const { name, email, bio, avatarUrl, location, phone, preferredCategories, defaultAddress, businessName, category, description, serviceAreas } =
    req.body ?? {};

  if (email !== undefined) {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return sendError(res, 400, "Please provide a valid email address.");
    }
    user.email = normalizedEmail;
  }

  if (name !== undefined) user.name = cleanString(name);
  if (!user.name) return sendError(res, 400, "Name is required.");

  user.profile.avatarUrl = avatarUrl !== undefined ? cleanString(avatarUrl) : user.profile.avatarUrl;
  user.profile.bio = bio !== undefined ? cleanString(bio) : user.profile.bio;
  user.profile.location = location !== undefined ? cleanString(location) : user.profile.location;
  user.profile.phone = phone !== undefined ? normalizePhone(phone) : user.profile.phone;

  if (user.role === "customer") {
    if (preferredCategories !== undefined) {
      user.customerProfile.preferredCategories = Array.isArray(preferredCategories)
        ? preferredCategories.map((item) => cleanString(item)).filter(Boolean)
        : [];
    }
    if (defaultAddress !== undefined) {
      user.customerProfile.defaultAddress = cleanString(defaultAddress);
    }
  }

  if (user.role === "vendor") {
    if (businessName !== undefined) user.vendorProfile.businessName = cleanString(businessName);
    if (category !== undefined) user.vendorProfile.category = cleanString(category);
    if (description !== undefined) user.vendorProfile.description = cleanString(description);
    if (serviceAreas !== undefined) {
      user.vendorProfile.serviceAreas = Array.isArray(serviceAreas)
        ? serviceAreas.map((item) => cleanString(item)).filter(Boolean)
        : [];
    }
  }

  await user.save();

  const contacts = user.role === "vendor"
    ? await VendorContact.find({ vendorId: user._id }).sort({ isPrimary: -1, createdAt: -1 })
    : [];

  return res.json({
    user: serializeUser(user),
    contacts: contacts.map(serializeVendorContact),
  });
}

export async function listVendorContacts(req, res) {
  const contacts = await VendorContact.find({ vendorId: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
  return res.json({ contacts: contacts.map(serializeVendorContact) });
}

export async function createVendorContact(req, res) {
  const payload = {
    vendorId: req.user._id,
    label: cleanString(req.body?.label),
    phone: normalizePhone(req.body?.phone),
    email: normalizeEmail(req.body?.email),
    notes: cleanString(req.body?.notes),
    isPrimary: Boolean(req.body?.isPrimary),
  };

  if (!payload.label || !payload.phone) {
    return sendError(res, 400, "Label and phone are required.");
  }

  if (payload.email && !isValidEmail(payload.email)) {
    return sendError(res, 400, "Please provide a valid email address.");
  }

  if (payload.isPrimary) {
    await VendorContact.updateMany({ vendorId: req.user._id, isPrimary: true }, { $set: { isPrimary: false } });
  }

  const contact = await VendorContact.create(payload);
  return res.status(201).json({ contact: serializeVendorContact(contact) });
}

export async function updateVendorContact(req, res) {
  const contact = await VendorContact.findOne({ _id: req.params.id, vendorId: req.user._id });
  if (!contact) return sendError(res, 404, "Contact not found");

  const nextEmail = req.body?.email !== undefined ? normalizeEmail(req.body.email) : contact.email;
  if (nextEmail && !isValidEmail(nextEmail)) {
    return sendError(res, 400, "Please provide a valid email address.");
  }

  if (req.body?.label !== undefined) contact.label = cleanString(req.body.label);
  if (req.body?.phone !== undefined) contact.phone = normalizePhone(req.body.phone);
  if (req.body?.email !== undefined) contact.email = nextEmail;
  if (req.body?.notes !== undefined) contact.notes = cleanString(req.body.notes);
  if (req.body?.isPrimary !== undefined) {
    contact.isPrimary = Boolean(req.body.isPrimary);
    if (contact.isPrimary) {
      await VendorContact.updateMany(
        { vendorId: req.user._id, _id: { $ne: contact._id }, isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }
  }

  if (!contact.label || !contact.phone) {
    return sendError(res, 400, "Label and phone are required.");
  }

  await contact.save();
  return res.json({ contact: serializeVendorContact(contact) });
}

export async function deleteVendorContact(req, res) {
  const contact = await VendorContact.findOne({ _id: req.params.id, vendorId: req.user._id });
  if (!contact) return sendError(res, 404, "Contact not found");
  await contact.deleteOne();
  return res.status(204).send();
}
