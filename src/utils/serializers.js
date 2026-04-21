export function serializeUser(user) {
  if (!user) return null;

  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status ?? "active",
    location: user.profile?.location ?? user.location ?? "",
    phone: user.profile?.phone ?? user.phone ?? "",
    category: user.vendorProfile?.category ?? user.category ?? "",
    rating: user.vendorProfile?.rating ?? user.rating ?? 4.5,
    profile: {
      avatarUrl: user.profile?.avatarUrl ?? "",
      bio: user.profile?.bio ?? "",
      location: user.profile?.location ?? user.location ?? "",
      phone: user.profile?.phone ?? user.phone ?? "",
    },
    customerProfile: {
      preferredCategories: user.customerProfile?.preferredCategories ?? [],
      defaultAddress: user.customerProfile?.defaultAddress ?? "",
    },
    vendorProfile: {
      businessName: user.vendorProfile?.businessName || user.name,
      category: user.vendorProfile?.category ?? user.category ?? "",
      description: user.vendorProfile?.description ?? "",
      rating: user.vendorProfile?.rating ?? user.rating ?? 4.5,
      serviceAreas: user.vendorProfile?.serviceAreas ?? [],
      contacts: user.vendorProfile?.contacts ?? [],
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeProduct(product) {
  if (!product) return null;

  return {
    id: String(product._id ?? product.id),
    name: product.name,
    title: product.name,
    description: product.description ?? "",
    price: product.price ?? 0,
    category: product.category ?? "",
    kind: product.kind ?? "product",
    status: product.status ?? "active",
    inventoryCount: product.inventoryCount ?? 0,
    tags: product.tags ?? [],
    vendorId: String(product.vendorId?._id ?? product.vendorId),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeRequest(request) {
  if (!request) return null;

  return {
    id: String(request._id ?? request.id),
    type: request.type,
    status: request.status,
    subject: request.subject ?? "",
    note: request.note ?? "",
    totalAmount: request.totalAmount ?? 0,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    fulfilledAt: request.fulfilledAt ?? null,
    items: (request.items ?? []).map((item) => ({
      productId: String(item.productId?._id ?? item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    customer: request.customerId ? serializeUser(request.customerId) : null,
    vendor: request.vendorId ? serializeUser(request.vendorId) : null,
    purchaseId: request.purchaseId ? String(request.purchaseId) : null,
  };
}

export function serializeChat(chat, currentUserId) {
  const current = currentUserId ? String(currentUserId) : "";

  return {
    id: String(chat._id ?? chat.id),
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    lastMessageAt: chat.lastMessageAt,
    customer: chat.customerId ? serializeUser(chat.customerId) : null,
    vendor: chat.vendorId ? serializeUser(chat.vendorId) : null,
    messages: (chat.messages ?? []).map((message) => ({
      id: String(message._id ?? message.id),
      text: message.text,
      createdAt: message.createdAt,
      sender: message.senderId ? serializeUser(message.senderId) : null,
      isOwn: String(message.senderId?._id ?? message.senderId) === current,
    })),
    preview: chat.messages?.length ? chat.messages[chat.messages.length - 1].text : "",
  };
}

export function serializePurchase(purchase) {
  if (!purchase) return null;

  return {
    id: String(purchase._id ?? purchase.id),
    requestId: String(purchase.requestId?._id ?? purchase.requestId),
    customer: purchase.customerId ? serializeUser(purchase.customerId) : null,
    vendor: purchase.vendorId ? serializeUser(purchase.vendorId) : null,
    status: purchase.status,
    totalAmount: purchase.totalAmount ?? 0,
    completedAt: purchase.completedAt ?? null,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
    items: (purchase.items ?? []).map((item) => ({
      productId: String(item.productId?._id ?? item.productId),
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };
}

export function serializeVendorContact(contact) {
  if (!contact) return null;

  return {
    id: String(contact._id ?? contact.id),
    vendorId: String(contact.vendorId?._id ?? contact.vendorId),
    label: contact.label,
    phone: contact.phone,
    email: contact.email ?? "",
    notes: contact.notes ?? "",
    isPrimary: Boolean(contact.isPrimary),
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}
