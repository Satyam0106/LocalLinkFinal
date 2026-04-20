import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api.js";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { Field } from "../components/Field.jsx";
import { ChatThread } from "../components/ChatThread.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { OrderDetailsModal } from "../components/OrderDetailsModal.jsx";

function statusBadgeClass(status) {
  if (status === "accepted") return "green";
  if (status === "pending") return "";
  return "gray";
}

function formatMoney(value) {
  return `Rs ${Number(value || 0).toFixed(0)}`;
}

export default function VendorDashboardPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatCustomerId, setActiveChatCustomerId] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [productMsg, setProductMsg] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);
  const [eName, setEName] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isVendor = user?.role === "vendor";

  const canAddProduct = useMemo(() => {
    if (!pName || !pPrice) return false;
    return Number.isFinite(Number(pPrice)) && Number(pPrice) >= 0;
  }, [pName, pPrice]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.customer?.id === activeChatCustomerId) ?? null,
    [activeChatCustomerId, chats]
  );

  async function loadRequests() {
    setError("");
    const data = await apiFetch("/requests", { token });
    setRequests(data.requests ?? []);
  }

  async function loadProducts() {
    if (!user?.id) return;
    const data = await apiFetch(`/products/${user.id}`, { token });
    setProducts(data.products ?? []);
  }

  async function loadChats() {
    const data = await apiFetch("/chats", { token });
    setChats(data.chats ?? []);
  }

  useEffect(() => {
    if (!token || !isVendor) return;
    let alive = true;
    const safeSetError = (err) => {
      if (!alive) return;
      setError(err?.message || "Something went wrong");
    };

    const refresh = () => {
      loadRequests().catch(safeSetError);
      loadProducts().catch(safeSetError);
      loadChats().catch(safeSetError);
    };

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    refresh();
    const interval = setInterval(refresh, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, isVendor, user?.id]);

  useEffect(() => {
    if (!chats.length) {
      setActiveChatCustomerId("");
      return;
    }
    if (!activeChatCustomerId || !chats.some((chat) => chat.customer?.id === activeChatCustomerId)) {
      setActiveChatCustomerId(chats[0].customer?.id ?? "");
    }
  }, [activeChatCustomerId, chats]);

  async function accept(id) {
    setBusyId(id);
    setError("");
    try {
      await apiFetch(`/request/${id}`, { token, method: "PUT", body: { status: "accepted" } });
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function decline(id) {
    setBusyId(id);
    setError("");
    try {
      await apiFetch(`/request/${id}`, { token, method: "PATCH", body: { status: "declined" } });
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeRequest(id) {
    if (!window.confirm("Remove this pending request from the database?")) return;
    setBusyId(id);
    setError("");
    try {
      await apiFetch(`/request/${id}`, { token, method: "DELETE" });
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function sendChatReply() {
    if (!activeChatCustomerId || !chatDraft.trim()) return;
    setChatBusy(true);
    setError("");
    try {
      const data = await apiFetch(`/chat/${activeChatCustomerId}/messages`, {
        token,
        method: "POST",
        body: { text: chatDraft.trim() },
      });
      const nextChat = data.chat;
      setChats((current) => {
        const rest = current.filter((chat) => chat.id !== nextChat.id);
        return [nextChat, ...rest];
      });
      setActiveChatCustomerId(nextChat.customer?.id ?? activeChatCustomerId);
      setChatDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setChatBusy(false);
    }
  }

  async function addProduct(e) {
    e.preventDefault();
    setProductMsg("");
    setError("");
    try {
      await apiFetch("/product", {
        token,
        method: "POST",
        body: { name: pName, price: Number(pPrice), description: pDesc },
      });
      setPName("");
      setPPrice("");
      setPDesc("");
      setProductMsg("Product added.");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditingProductId(p.id);
    setEName(p.name);
    setEPrice(String(p.price));
    setEDesc(p.description ?? "");
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingProductId) return;
    setError("");
    try {
      await apiFetch(`/product/${editingProductId}`, {
        token,
        method: "PATCH",
        body: { name: eName, price: Number(ePrice), description: eDesc },
      });
      setEditingProductId(null);
      setProductMsg("Product updated.");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    setError("");
    try {
      await apiFetch(`/product/${id}`, { token, method: "DELETE" });
      if (editingProductId === id) setEditingProductId(null);
      setProductMsg("Product deleted.");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!isVendor) {
    return (
      <div className="card">
        <div className="title">Vendor dashboard</div>
        <div className="subtitle">Login as a vendor to manage requests and products.</div>
      </div>
    );
  }

  return (
    <div className="section">
      <PageHeader
        title="Dashboard"
        subtitle="Review incoming cart orders, service requests, and in-app chats."
        right={
          <button
            className="btn secondary"
            onClick={() => {
              loadRequests().catch((err) => setError(err.message));
              loadProducts().catch((err) => setError(err.message));
              loadChats().catch((err) => setError(err.message));
            }}
          >
            Refresh
          </button>
        }
      />

      {error ? <div className="card danger">{error}</div> : null}

      <div className="split">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="vendor-meta">
              <div>
                <div className="title">Orders and requests</div>
                <div className="subtitle">Accept, decline, or delete pending items.</div>
              </div>
              <span className="badge gray">{requests.length} total</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {requests.map((r) => (
              <div key={r.id} className="card vendor-card" style={{ padding: 0 }}>
                <div className="vendor-hero" style={{ height: 92 }}>
                  <div style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}>
                    <span className={`badge ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </div>
                  <div style={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}>
                    <span className="badge gray">{r.type === "order" ? "Order" : "Service"}</span>
                  </div>
                </div>
                <div className="vendor-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 950 }}>{r.customer?.name ?? "Customer"}</div>
                        <div className="vendor-sub">
                          {r.status === "accepted" || r.status === "completed" ? r.customer?.location || "-" : "Location hidden until accepted"}
                        </div>
                      </div>
                      {r.type === "order" ? <div style={{ fontWeight: 900 }}>{formatMoney(r.totalAmount)}</div> : null}
                    </div>

                    {r.type === "order" && r.items?.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {r.items.map((item) => (
                          <div
                            key={`${r.id}-${item.productId}`}
                            style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#475569", fontSize: 14 }}
                          >
                            <span>
                              {item.name} x {item.quantity}
                            </span>
                            <span>{formatMoney(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                      <button className="btn secondary" type="button" onClick={() => setSelectedRequest(r)}>
                        View details
                      </button>
                      <button className="btn" disabled={r.status !== "pending" || busyId === r.id} onClick={() => accept(r.id)}>
                        {busyId === r.id ? "Working..." : "Accept"}
                      </button>
                      <button
                        className="btn secondary"
                        disabled={r.status !== "pending" || busyId === r.id}
                        onClick={() => decline(r.id)}
                      >
                        Decline
                      </button>
                      <button
                        className="btn secondary"
                        disabled={r.status !== "pending" || busyId === r.id}
                        onClick={() => removeRequest(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {requests.length === 0 ? (
            <div className="card">
              <div className="title">No requests yet</div>
              <div className="subtitle">Have a customer add products to cart from your vendor profile.</div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="vendor-meta">
              <div>
                <div className="title">Customer chats</div>
                <div className="subtitle">Reply to customers inside Localink.</div>
              </div>
              <span className="badge gray">{chats.length} threads</span>
            </div>
          </div>

          <div className="card">
            <div className="chat-list">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`chat-list-item${chat.customer?.id === activeChatCustomerId ? " active" : ""}`}
                  onClick={() => setActiveChatCustomerId(chat.customer?.id ?? "")}
                >
                  <div style={{ fontWeight: 900 }}>{chat.customer?.name ?? "Customer"}</div>
                  <div className="vendor-sub">{chat.customer?.location || "-"}</div>
                  <div className="vendor-sub" style={{ marginTop: 6 }}>
                    {chat.preview || "No messages yet"}
                  </div>
                </button>
              ))}
            </div>
            {chats.length === 0 ? <div className="subtitle" style={{ marginTop: 10 }}>No chats yet.</div> : null}
          </div>

          <ChatThread
            title={activeChat ? `Chat with ${activeChat.customer?.name ?? "customer"}` : "In-app chat"}
            subtitle={activeChat ? "Send replies here. Customers will see them on the vendor page." : "Select a conversation to reply."}
            messages={activeChat?.messages ?? []}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSend={sendChatReply}
            sending={chatBusy}
            disabled={!activeChat}
            emptyLabel="No messages in this thread yet."
          />

          <div className="card">
            <div className="title">Add a product</div>
            <div className="subtitle" style={{ marginTop: 6 }}>This will show up on your vendor profile.</div>
          </div>

          <div className="card">
            <form onSubmit={addProduct} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Name">
                <input
                  className="input"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  onInput={(e) => setPName(e.target.value)}
                  placeholder="Ceramic vase"
                />
              </Field>
              <div className="row">
                <div style={{ flex: 1 }}>
                  <Field label="Price">
                    <input
                      className="input"
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      onInput={(e) => setPPrice(e.target.value)}
                      placeholder="1200"
                    />
                  </Field>
                </div>
                <div style={{ flex: 2 }}>
                  <Field label="Description (optional)">
                    <input
                      className="input"
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      onInput={(e) => setPDesc(e.target.value)}
                      placeholder="Handmade, locally sourced..."
                    />
                  </Field>
                </div>
              </div>
              {productMsg ? <div style={{ fontWeight: 800, color: "#166534" }}>{productMsg}</div> : null}
              <button className="btn" disabled={!canAddProduct} type="submit">
                Add product
              </button>
            </form>
          </div>

          <div className="card">
            <div className="vendor-meta">
              <div>
                <div className="title">Your products</div>
                <div className="subtitle">Edit or remove products shown to customers.</div>
              </div>
              <span className="badge gray">{products.length} items</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((p) =>
              editingProductId === p.id ? (
                <form key={p.id} className="card" onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Field label="Name">
                    <input className="input" value={eName} onChange={(e) => setEName(e.target.value)} />
                  </Field>
                  <Field label="Price">
                    <input className="input" value={ePrice} onChange={(e) => setEPrice(e.target.value)} />
                  </Field>
                  <Field label="Description">
                    <input className="input" value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                  </Field>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn" type="submit">
                      Save
                    </button>
                    <button className="btn secondary" type="button" onClick={() => setEditingProductId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 950 }}>{p.name}</div>
                    <div className="vendor-sub">
                      {formatMoney(p.price)} - {p.description || "-"}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn secondary" type="button" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn secondary" type="button" onClick={() => removeProduct(p.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>

          {products.length === 0 ? (
            <div className="card">
              <div className="title">No products yet</div>
              <div className="subtitle">Add a product above to show it on your public vendor profile.</div>
            </div>
          ) : null}
        </div>
      </div>

      <OrderDetailsModal
        open={Boolean(selectedRequest)}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
