import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { useCart } from "../app/cart/CartContext.jsx";
import { apiFetch } from "../services/api.js";
import { PageHeader } from "../components/PageHeader.jsx";

function formatMoney(value) {
  return `Rs ${Number(value || 0).toFixed(0)}`;
}

function vendorTotal(items) {
  return (items ?? []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
}

export default function CartPage() {
  const { token, user } = useAuth();
  const { cart, setQuantity, removeItem, clearVendor, clearAll } = useCart();
  const navigate = useNavigate();
  const [busyVendor, setBusyVendor] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const vendorIds = useMemo(() => Object.keys(cart.byVendor ?? {}), [cart.byVendor]);

  async function checkoutVendor(vendorId) {
    const items = cart.byVendor?.[vendorId] ?? [];
    if (!items.length) return;
    setBusyVendor(vendorId);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/request", {
        token,
        method: "POST",
        body: {
          vendorId,
          type: "order",
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        },
      });
      clearVendor(vendorId);
      setSuccess("Order sent to the vendor.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyVendor("");
    }
  }

  if (user?.role !== "customer") {
    return (
      <div className="card">
        <div className="title">Cart</div>
        <div className="subtitle">Only customers can place cart orders.</div>
      </div>
    );
  }

  return (
    <div className="section">
      <PageHeader
        title="Your cart"
        subtitle="Review items from any vendor and submit orders when you're ready."
        right={
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn secondary" to="/vendors">
              Continue browsing
            </Link>
            <button
              className="btn secondary"
              type="button"
              disabled={!vendorIds.length}
              onClick={() => {
                if (!window.confirm("Clear your entire cart?")) return;
                clearAll();
                setSuccess("Cart cleared.");
                setError("");
              }}
            >
              Clear all
            </button>
          </div>
        }
      />

      {error ? <div className="card danger">{error}</div> : null}
      {success ? <div className="card" style={{ borderColor: "#bbf7d0", background: "#f0fdf4" }}>{success}</div> : null}

      {vendorIds.length === 0 ? (
        <div className="card">
          <div className="title">Your cart is empty</div>
          <div className="subtitle" style={{ marginTop: 6 }}>
            Visit a vendor profile and add products to see them here.
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" type="button" onClick={() => navigate("/vendors")}>
              Browse vendors
            </button>
          </div>
        </div>
      ) : null}

      {vendorIds.map((vendorId) => {
        const items = cart.byVendor?.[vendorId] ?? [];
        const total = vendorTotal(items);
        return (
          <div key={vendorId} className="card">
            <div className="vendor-meta" style={{ alignItems: "center" }}>
              <div>
                <div className="title">Vendor order</div>
                <div className="subtitle">Vendor ID: {vendorId}</div>
              </div>
              <span className="badge gray">{items.length} items</span>
            </div>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => (
                <div key={item.productId} className="cart-line">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{item.name}</div>
                      <div className="vendor-sub">{formatMoney(item.price)} each</div>
                    </div>
                    <button className="btn ghost" type="button" onClick={() => removeItem(vendorId, item.productId)}>
                      Remove
                    </button>
                  </div>
                  <div className="row" style={{ marginTop: 10, alignItems: "center" }}>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setQuantity(vendorId, item.productId, e.target.value)}
                      style={{ maxWidth: 110 }}
                    />
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      Line total: {formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div className="subtitle">Order total</div>
                <div className="title" style={{ marginTop: 4 }}>{formatMoney(total)}</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Remove all items for this vendor?")) return;
                    clearVendor(vendorId);
                  }}
                >
                  Clear vendor
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={!token || busyVendor === vendorId || items.length === 0}
                  onClick={() => checkoutVendor(vendorId)}
                >
                  {busyVendor === vendorId ? "Sending..." : "Send order"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

