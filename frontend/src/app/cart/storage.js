const KEY_PREFIX = "localink_cart_v1:";

function keyForUser(userId) {
  return `${KEY_PREFIX}${userId || "anonymous"}`;
}

export function loadCart(userId) {
  try {
    const raw = localStorage.getItem(keyForUser(userId));
    if (!raw) return { byVendor: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { byVendor: {} };
    if (!parsed.byVendor || typeof parsed.byVendor !== "object") return { byVendor: {} };
    return { byVendor: parsed.byVendor };
  } catch {
    return { byVendor: {} };
  }
}

export function saveCart(userId, cart) {
  localStorage.setItem(keyForUser(userId), JSON.stringify(cart));
}

export function clearCart(userId) {
  localStorage.removeItem(keyForUser(userId));
}

