import mongoose from "mongoose";

const ContactMethodSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Primary" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const BaseProfileSchema = new mongoose.Schema(
  {
    avatarUrl: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CustomerProfileSchema = new mongoose.Schema(
  {
    preferredCategories: { type: [String], default: [] },
    defaultAddress: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const VendorProfileSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
    serviceAreas: { type: [String], default: [] },
    contacts: { type: [ContactMethodSchema], default: [] },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["customer", "vendor"] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    profile: { type: BaseProfileSchema, default: () => ({}) },
    customerProfile: { type: CustomerProfileSchema, default: () => ({}) },
    vendorProfile: { type: VendorProfileSchema, default: () => ({}) },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("location")
  .get(function getLocation() {
    return this.profile?.location ?? "";
  })
  .set(function setLocation(value) {
    if (!this.profile) this.profile = {};
    this.profile.location = value;
  });

UserSchema.virtual("phone")
  .get(function getPhone() {
    return this.profile?.phone ?? "";
  })
  .set(function setPhone(value) {
    if (!this.profile) this.profile = {};
    this.profile.phone = value;
  });

UserSchema.virtual("category")
  .get(function getCategory() {
    return this.vendorProfile?.category ?? "";
  })
  .set(function setCategory(value) {
    if (!this.vendorProfile) this.vendorProfile = {};
    this.vendorProfile.category = value;
  });

UserSchema.virtual("rating")
  .get(function getRating() {
    return this.vendorProfile?.rating ?? 4.5;
  })
  .set(function setRating(value) {
    if (!this.vendorProfile) this.vendorProfile = {};
    this.vendorProfile.rating = value;
  });

UserSchema.index({ role: 1, "vendorProfile.category": 1 });
UserSchema.index({ role: 1, "profile.location": 1 });

export const User = mongoose.model("User", UserSchema);
