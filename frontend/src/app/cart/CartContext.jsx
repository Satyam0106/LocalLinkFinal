import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearCart, loadCart, saveCart } from "./storage.js";

const CartContext = createContext(null);

function emptyCart() {
  return { byVendor: {} };
}

function normalizeQuantity(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function computeCount(cart) {
  const vendors = Object.values(cart.byVendor ?? {});
  let total = 0;
  for (const items of vendors) {
    for (const item of items ?? []) {
      total += Number(item?.quantity ?? 0) || 0;
    }
  }
  return total;
}

export function CartProvider({ userId, children }) {
  const [cart, setCart] = useState(() => loadCart(userId));

  // Reload cart when user changes (login/logout)
  useEffect(() => {
    setCart(loadCart(userId));
  }, [userId]);

  // Persist cart for the current user
  useEffect(() => {
    if (!userId) return;
    saveCart(userId, cart);
  }, [userId, cart]);

  const value = useMemo(() => {
    const count = computeCount(cart);

    function getItems(vendorId) {
      return cart.byVendor?.[vendorId] ?? [];
    }

    function addItem(vendorId, product) {
      const quantity = normalizeQuantity(product?.quantity ?? 1) ?? 1;
      const productId = String(product?.productId ?? product?.id ?? "");
      if (!vendorId || !productId) return;

      setCart((current) => {
        const next = { ...current, byVendor: { ...(current.byVendor ?? {}) } };
        const list = [...(next.byVendor[vendorId] ?? [])];
        const idx = list.findIndex((item) => String(item.productId) === productId);
        if (idx >= 0) {
          const existing = list[idx];
          list[idx] = { ...existing, quantity: (Number(existing.quantity) || 0) + quantity };
        } else {
          list.push({
            productId,
            name: String(product?.name ?? ""),
            price: Number(product?.price ?? 0) || 0,
            quantity,
          });
        }
        next.byVendor[vendorId] = list;
        return next;
      });
    }

    function setQuantity(vendorId, productId, quantity) {
      const q = normalizeQuantity(quantity);
      if (!vendorId || !productId || !q) return;
      setCart((current) => {
        const next = { ...current, byVendor: { ...(current.byVendor ?? {}) } };
        const list = [...(next.byVendor[vendorId] ?? [])].map((item) =>
          String(item.productId) === String(productId) ? { ...item, quantity: q } : item
        );
        next.byVendor[vendorId] = list;
        return next;
      });
    }

    function removeItem(vendorId, productId) {
      if (!vendorId || !productId) return;
      setCart((current) => {
        const next = { ...current, byVendor: { ...(current.byVendor ?? {}) } };
        const list = (next.byVendor[vendorId] ?? []).filter((item) => String(item.productId) !== String(productId));
        if (list.length) next.byVendor[vendorId] = list;
        else delete next.byVendor[vendorId];
        return next;
      });
    }

    function clearVendor(vendorId) {
      if (!vendorId) return;
      setCart((current) => {
        const next = { ...current, byVendor: { ...(current.byVendor ?? {}) } };
        delete next.byVendor[vendorId];
        return next;
      });
    }

    function clearAll() {
      if (userId) clearCart(userId);
      setCart(emptyCart());
    }

    return {
      cart,
      count,
      getItems,
      addItem,
      setQuantity,
      removeItem,
      clearVendor,
      clearAll,
    };
  }, [cart, userId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

