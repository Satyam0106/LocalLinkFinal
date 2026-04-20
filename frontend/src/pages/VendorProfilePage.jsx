import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../services/api.js";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { useCart } from "../app/cart/CartContext.jsx";
import { ChatThread } from "../components/ChatThread.jsx";

function vendorGradient(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("bak")) return "linear-gradient(135deg, rgba(245,158,11,0.40), rgba(34,197,94,0.18))";
  if (c.includes("gro")) return "linear-gradient(135deg, rgba(34,197,94,0.42), rgba(16,185,129,0.18))";
  if (c.includes("hand")) return "linear-gradient(135deg, rgba(59,130,246,0.26), rgba(168,85,247,0.18))";
  if (c.includes("rep")) return "linear-gradient(135deg, rgba(148,163,184,0.36), rgba(34,197,94,0.18))";
  return "linear-gradient(135deg, rgba(34,197,94,0.32), rgba(59,130,246,0.14))";
}

function formatMoney(value) {
  return `Rs ${Number(value || 0).toFixed(0)}`;
}

function buildPhoneLink(phone) {
  const digits = String(phone ?? "").replace(/[^\d+]/g, "");
  return digits || "";
}

export default function VendorProfilePage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { addItem, clearVendor, getItems, removeItem, setQuantity } = useCart();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [quantityByProduct, setQuantityByProduct] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [chat, setChat] = useState(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const canRequest = useMemo(() => user?.role === "customer", [user]);
  const cart = useMemo(() => (id ? getItems(id) : []), [getItems, id]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const phoneLink = buildPhoneLink(vendor?.phone);
  const callHref = phoneLink ? `tel:${phoneLink}` : "";

  useEffect(() => {
    let alive = true;
    setError("");
    setSuccess("");
    Promise.all([apiFetch(`/vendor/${id}`, { token }), apiFetch(`/products/${id}`, { token })])
      .then(([v, p]) => {
        if (!alive) return;
        setVendor(v.vendor);
        setProducts(p.products ?? []);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [id, token]);

  useEffect(() => {
    if (!canRequest || !token || !id) return;
    let alive = true;
    const refresh = () =>
      apiFetch(`/chat/${id}`, { token })
        .then((data) => {
          if (!alive) return;
          setChat(data.chat);
        })
        .catch((err) => alive && setError(err.message));

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    refresh();
    const interval = setInterval(refresh, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [canRequest, id, token]);

  function getDraftQuantity(productId) {
    return quantityByProduct[productId] ?? "1";
  }

  function setDraftQuantity(productId, value) {
    if (value === "") {
      setQuantityByProduct((current) => ({ ...current, [productId]: "" }));
      return;
    }

    const next = Number(value);
    if (!Number.isInteger(next) || next < 1) return;
    setQuantityByProduct((current) => ({ ...current, [productId]: String(next) }));
  }

  function addToCart(product) {
    const quantity = Number(getDraftQuantity(product.id));
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Please enter a valid quantity before adding to cart.");
      return;
    }

    setError("");
    setSuccess("");
    if (id) {
      addItem(id, { productId: product.id, name: product.name, price: Number(product.price), quantity });
    }
    setQuantityByProduct((current) => ({ ...current, [product.id]: "1" }));
  }

  function updateCartQuantity(productId, value) {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1) return;
    if (id) setQuantity(id, productId, quantity);
  }

  function removeFromCart(productId) {
    if (id) removeItem(id, productId);
  }

  async function requestService() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/request", { token, method: "POST", body: { vendorId: id, type: "service" } });
      setSuccess("Service request sent. The vendor can accept or decline it from the dashboard.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCart() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/request", {
        token,
        method: "POST",
        body: {
          vendorId: id,
          type: "order",
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      });
      clearVendor(id);
      setSuccess("Cart sent to the vendor. They can now accept or decline your order.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendChatMessage() {
    if (!chatDraft.trim()) return;
    setChatBusy(true);
    setError("");
    try {
      const data = await apiFetch(`/chat/${id}/messages`, {
        token,
        method: "POST",
        body: { text: chatDraft.trim() },
      });
      setChat(data.chat);
      setChatDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <div className="section">
      <div className="card vendor-card">
        <div className="vendor-hero" style={{ height: 160, background: vendorGradient(vendor?.category) }}>
          <div style={{ position: "absolute", left: 14, top: 14, zIndex: 1 }}>
            <span className="badge gray">{vendor?.category || "Vendor"}</span>
          </div>
          <div style={{ position: "absolute", right: 14, top: 14, zIndex: 1 }}>
            <span className="badge">{((vendor?.rating ?? 0) || 0).toFixed(1)} star</span>
          </div>
        </div>
        {vendor ? (
          <div className="vendor-body">
            <div className="vendor-meta" style={{ alignItems: "center" }}>
              <div>
                <div className="vendor-name" style={{ fontSize: 20 }}>{vendor.name}</div>
                <div className="vendor-sub">{vendor.location || "-"}</div>
              </div>
              <div className="row" style={{ alignItems: "center" }}>
                <button className="btn" disabled={!canRequest || busy} onClick={requestService}>
                  {busy ? "Sending..." : "Request service"}
                </button>
              </div>
            </div>
            {!canRequest ? (
              <div className="subtitle" style={{ marginTop: 10 }}>
                Login as a customer to build a cart, chat, or call this vendor.
              </div>
            ) : (
              <div className="subtitle" style={{ marginTop: 10 }}>
                Choose product quantities, send your order, or message the vendor inside the app.
              </div>
            )}
          </div>
        ) : (
          <div className="vendor-body">
            <div className="subtitle">Loading vendor...</div>
          </div>
        )}
      </div>

      {error ? <div className="card danger">{error}</div> : null}
      {success ? <div className="card" style={{ borderColor: "#bbf7d0", background: "#f0fdf4" }}>{success}</div> : null}

      <div className="split">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="vendor-meta">
              <div>
                <div className="title">Products</div>
                <div className="subtitle">Add items to the cart with your chosen quantity.</div>
              </div>
              <span className="badge gray">{products.length} items</span>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {products.map((p) => (
              <div key={p.id} className="card vendor-card">
                <div className="vendor-hero" style={{ height: 120, background: vendorGradient(vendor?.category) }}>
                  <div style={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}>
                    <span className="badge green">{formatMoney(p.price)}</span>
                  </div>
                </div>
                <div className="vendor-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 950 }}>{p.name}</div>
                    <div className="vendor-sub">{p.description || "-"}</div>
                  </div>
                  <div className="row" style={{ alignItems: "center" }}>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={getDraftQuantity(p.id)}
                      onChange={(e) => setDraftQuantity(p.id, e.target.value)}
                      style={{ maxWidth: 96 }}
                    />
                    <button className="btn secondary" disabled={!canRequest || busy} onClick={() => addToCart(p)}>
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="title">Contact vendor</div>
            <div className="subtitle" style={{ marginTop: 6 }}>Call directly or use the built-in chat below.</div>
            <div className="row" style={{ marginTop: 14 }}>
              <a
                className={`btn secondary${canRequest && callHref ? "" : " disabled-link"}`}
                href={canRequest && callHref ? callHref : undefined}
                aria-disabled={!canRequest || !callHref}
              >
                Call vendor
              </a>
            </div>
            <div className="vendor-sub" style={{ marginTop: 12 }}>
              Phone: {vendor?.phone || "Not added yet"}
            </div>
            <div className="vendor-sub">Email: {vendor?.email || "Not added yet"}</div>
          </div>

          <ChatThread
            title="In-app chat"
            subtitle="Send messages here instead of using WhatsApp."
            messages={chat?.messages ?? []}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSend={sendChatMessage}
            sending={chatBusy}
            disabled={!canRequest}
            emptyLabel="No messages yet. Start the conversation with this vendor."
          />

          <div className="card">
            <div className="title">Cart</div>
            <div className="subtitle" style={{ marginTop: 6 }}>
              Review quantities here before sending the order to the vendor.
            </div>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.map((item) => (
                <div key={item.productId} style={{ border: "1px solid rgba(15, 23, 42, 0.08)", borderRadius: 14, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{item.name}</div>
                      <div className="vendor-sub">{formatMoney(item.price)} each</div>
                    </div>
                    <button className="btn ghost" type="button" onClick={() => removeFromCart(item.productId)}>
                      Remove
                    </button>
                  </div>
                  <div className="row" style={{ marginTop: 10, alignItems: "center" }}>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.productId, e.target.value)}
                      style={{ maxWidth: 96 }}
                    />
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      Line total: {formatMoney(item.quantity * item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cart.length === 0 ? <div className="subtitle" style={{ marginTop: 14 }}>Your cart is empty.</div> : null}

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div className="subtitle">Order total</div>
                <div className="title" style={{ marginTop: 4 }}>{formatMoney(cartTotal)}</div>
              </div>
              <button className="btn" disabled={!canRequest || busy || cart.length === 0} onClick={submitCart}>
                {busy ? "Sending..." : "Send cart to vendor"}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="title">Location</div>
            <div className="subtitle" style={{ marginTop: 6 }}>{vendor?.location || "-"}</div>
            <div style={{ marginTop: 12 }}>
              <button className="btn secondary" disabled>
                Open in Maps (MVP)
              </button>
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card">
          <div className="title">No products yet</div>
          <div className="subtitle">The vendor can add products from their dashboard.</div>
        </div>
      ) : null}
    </div>
  );
}
