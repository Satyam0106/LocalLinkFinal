import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../services/api.js";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

const CATEGORY_OPTIONS = ["All categories", "Grocery", "Bakery", "Handmade", "Repairs", "Services"];

function vendorGradient(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("bak")) return "linear-gradient(135deg, rgba(245,158,11,0.35), rgba(34,197,94,0.18))";
  if (c.includes("gro")) return "linear-gradient(135deg, rgba(34,197,94,0.38), rgba(16,185,129,0.18))";
  if (c.includes("hand")) return "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(168,85,247,0.18))";
  if (c.includes("rep")) return "linear-gradient(135deg, rgba(148,163,184,0.35), rgba(34,197,94,0.18))";
  return "linear-gradient(135deg, rgba(34,197,94,0.30), rgba(59,130,246,0.14))";
}

function formatMoney(value) {
  return `Rs ${Number(value || 0).toFixed(0)}`;
}

export default function CustomerHomePage() {
  const { token, user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const rawQuery = (searchParams.get("q") ?? "").trim();
  const query = rawQuery.toLowerCase();
  const selectedCategory = searchParams.get("category") ?? "";

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesQuery =
        !query ||
        [vendor.name, vendor.category, vendor.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesCategory =
        !selectedCategory || selectedCategory === "All categories" || vendor.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [query, selectedCategory, vendors]);

  async function loadRequests() {
    const data = await apiFetch("/requests", { token });
    setRequests(data.requests ?? []);
  }

  useEffect(() => {
    let alive = true;
    setError("");
    apiFetch("/vendors", { token })
      .then((data) => {
        if (!alive) return;
        setVendors(data.vendors ?? []);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (user?.role !== "customer" || !token) return;
    let alive = true;
    const refresh = () =>
      apiFetch("/requests", { token })
        .then((data) => alive && setRequests(data.requests ?? []))
        .catch(() => alive && setRequests([]));

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    refresh();
    const interval = setInterval(refresh, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, user?.role]);

  async function cancelRequest(id) {
    setBusyId(id);
    setError("");
    try {
      await apiFetch(`/request/${id}`, { token, method: "PATCH", body: { status: "cancelled" } });
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRequest(id) {
    if (!window.confirm("Delete this pending request?")) return;
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

  function updateCategory(value) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "All categories") {
      next.delete("category");
    } else {
      next.set("category", value);
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (rawQuery) next.set("q", rawQuery);
    setSearchParams(next, { replace: true });
  }

  if (user?.role !== "customer") {
    return (
      <div className="card">
        <div className="title">Customer area</div>
        <div className="subtitle">Login as a customer to browse vendors.</div>
      </div>
    );
  }

  return (
    <div className="section">
      <PageHeader
        title="Browse vendors"
        subtitle="Search from the top bar and narrow results with the category dropdown."
        right={<span className="badge green">{filteredVendors.length} matches</span>}
      />

      <div className="card">
        <div className="filter-grid" style={{ marginTop: 14 }}>
          <div>
            <div className="subtitle" style={{ marginBottom: 6 }}>Category</div>
            <select className="input" value={selectedCategory || "All categories"} onChange={(e) => updateCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="subtitle" style={{ marginBottom: 6 }}>Active search</div>
            <div className="search-summary">
              {rawQuery ? `Showing results for "${rawQuery}"` : "Showing all vendors"}
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn secondary" type="button" onClick={clearFilters}>
              Clear category
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="card danger">{error}</div> : null}

      <div className="card">
        <div className="vendor-meta">
          <div>
            <div className="title" style={{ fontSize: 18 }}>My orders and requests</div>
            <div className="subtitle">Track cart orders, service requests, and vendor decisions.</div>
          </div>
          <span className="badge gray">{requests.length} total</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {requests.map((r) => (
            <div key={r.id} className="card vendor-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 950 }}>{r.vendor?.name ?? "Vendor"}</div>
                  <div className="vendor-sub">
                    {r.type === "order" ? "Order" : "Service request"} - {r.status}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button
                    className="btn secondary"
                    disabled={r.status !== "pending" || busyId === r.id}
                    onClick={() => cancelRequest(r.id)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn secondary"
                    disabled={r.status !== "pending" || busyId === r.id}
                    onClick={() => deleteRequest(r.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {r.type === "order" && r.items?.length ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontWeight: 900 }}>
                    <span>Total</span>
                    <span>{formatMoney(r.totalAmount)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {requests.length === 0 ? <div className="subtitle" style={{ marginTop: 10 }}>No requests yet.</div> : null}
      </div>

      <div className="grid">
        {filteredVendors.map((v) => (
          <Link key={v.id} to={`/vendor/${v.id}`} className="card vendor-card" style={{ display: "block" }}>
            <div className="vendor-hero" style={{ background: vendorGradient(v.category) }}>
              <div style={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}>
                <span className="badge">{(v.rating ?? 0).toFixed(1)} star</span>
              </div>
              <div style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}>
                <span className="badge gray">{v.category || "Vendor"}</span>
              </div>
            </div>
            <div className="vendor-body">
              <div className="vendor-meta">
                <div>
                  <div className="vendor-name">{v.name}</div>
                  <div className="vendor-sub">{v.location || "-"}</div>
                </div>
                <span className="badge green">Open now</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {vendors.length > 0 && filteredVendors.length === 0 ? (
        <div className="card">
          <div className="title">No vendors match your filters</div>
          <div className="subtitle">Try another search term or switch the category dropdown back to all categories.</div>
        </div>
      ) : null}

      {vendors.length === 0 ? (
        <div className="card">
          <div className="title">No vendors yet</div>
          <div className="subtitle">Create a vendor account in the signup screen to appear here.</div>
        </div>
      ) : null}
    </div>
  );
}
