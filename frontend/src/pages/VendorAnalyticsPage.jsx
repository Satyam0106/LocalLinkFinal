import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { apiFetch } from "../services/api.js";
import { PageHeader } from "../components/PageHeader.jsx";

function formatMoney(value) {
  return `Rs ${Number(value || 0).toFixed(0)}`;
}

function formatDay(value) {
  try {
    return new Intl.DateTimeFormat("en-IN", { month: "short", day: "2-digit" }).format(new Date(value));
  } catch {
    return String(value ?? "");
  }
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucketKey(date, granularity) {
  const d = new Date(date);
  if (granularity === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (granularity === "weekly") {
    const s = startOfDay(d);
    const day = (s.getDay() + 6) % 7; // Monday=0
    s.setDate(s.getDate() - day);
    return s.toISOString().slice(0, 10);
  }
  return startOfDay(d).toISOString().slice(0, 10);
}

function labelForBucket(key, granularity) {
  if (granularity === "monthly") return key;
  if (granularity === "weekly") return `${key} (wk)`;
  return formatDay(key);
}

const PIE_COLORS = ["#a3e635", "#60a5fa", "#fbbf24", "#f472b6", "#c084fc", "#22c55e", "#38bdf8", "#fb7185"];

export default function VendorAnalyticsPage() {
  const { token, user } = useAuth();
  const [granularity, setGranularity] = useState("daily"); // daily|weekly|monthly
  const [purchases, setPurchases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const isVendor = user?.role === "vendor";

  async function loadAll() {
    if (!token || !isVendor) return;
    setLoading(true);
    setError("");
    try {
      const [p, r] = await Promise.all([apiFetch("/purchases", { token }), apiFetch("/requests", { token })]);
      setPurchases(p.purchases ?? []);
      setRequests(r.requests ?? []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // update dynamically as new orders come in
    const id = setInterval(() => loadAll(), 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isVendor]);

  const orderRequests = useMemo(() => (requests ?? []).filter((r) => r.type === "order"), [requests]);

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, accepted: 0, declined: 0, cancelled: 0, completed: 0 };
    for (const r of orderRequests) {
      const s = String(r.status ?? "");
      if (counts[s] !== undefined) counts[s] += 1;
    }
    return counts;
  }, [orderRequests]);

  const uniqueCustomers = useMemo(() => {
    const set = new Set();
    for (const purchase of purchases ?? []) {
      if (purchase.customer?.id) set.add(purchase.customer.id);
    }
    return set.size;
  }, [purchases]);

  const salesOverTime = useMemo(() => {
    const map = new Map();
    for (const purchase of purchases ?? []) {
      const createdAt = purchase.createdAt || purchase.updatedAt;
      if (!createdAt) continue;
      const key = bucketKey(createdAt, granularity);
      const prev = map.get(key) ?? 0;
      map.set(key, prev + (Number(purchase.totalAmount) || 0));
    }
    const rows = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, revenue]) => ({ key, label: labelForBucket(key, granularity), revenue }));
    return rows;
  }, [purchases, granularity]);

  const totalRevenue = useMemo(() => (purchases ?? []).reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0), [purchases]);

  const soldBreakdown = useMemo(() => {
    const map = new Map(); // name -> qty
    for (const purchase of purchases ?? []) {
      for (const item of purchase.items ?? []) {
        const name = String(item.name ?? "Item");
        const qty = Number(item.quantity ?? 0) || 0;
        map.set(name, (map.get(name) ?? 0) + qty);
      }
    }
    const rows = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, qty]) => ({ name, value: qty }));
    return rows;
  }, [purchases]);

  const topProducts = useMemo(() => {
    const map = new Map(); // name -> {qty,revenue}
    for (const purchase of purchases ?? []) {
      for (const item of purchase.items ?? []) {
        const name = String(item.name ?? "Item");
        const qty = Number(item.quantity ?? 0) || 0;
        const subtotal = Number(item.subtotal ?? 0) || 0;
        const prev = map.get(name) ?? { qty: 0, revenue: 0 };
        map.set(name, { qty: prev.qty + qty, revenue: prev.revenue + subtotal });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [purchases]);

  if (!isVendor) {
    return (
      <div className="card">
        <div className="title">Vendor analytics</div>
        <div className="subtitle">Login as a vendor to view sales and order insights.</div>
      </div>
    );
  }

  return (
    <div className="section">
      <PageHeader
        title="Analytics"
        subtitle="Live insights from your orders and purchases."
        right={
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <select className="input" value={granularity} onChange={(e) => setGranularity(e.target.value)} style={{ width: 160 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button className="btn secondary" type="button" onClick={loadAll} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Link className="btn secondary" to="/vendor/dashboard">
              Back
            </Link>
          </div>
        }
      />

      {error ? <div className="card danger">{error}</div> : null}

      <div className="analytics-grid">
        <div className="card stat-card">
          <div className="stat-label">Total revenue</div>
          <div className="stat-value">{formatMoney(totalRevenue)}</div>
          <div className="stat-sub">
            {lastUpdatedAt ? `Updated ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(lastUpdatedAt)}` : ""}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total customers</div>
          <div className="stat-value">{uniqueCustomers}</div>
          <div className="stat-sub">Unique buyers from purchases</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Orders</div>
          <div className="stat-value">{orderRequests.length}</div>
          <div className="stat-sub">Total order requests</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Accepted</div>
          <div className="stat-value">{statusCounts.accepted}</div>
          <div className="stat-sub">Accepted orders</div>
        </div>
      </div>

      <div className="analytics-panels">
        <div className="card">
          <div className="vendor-meta" style={{ alignItems: "center" }}>
            <div>
              <div className="title">Overall sales</div>
              <div className="subtitle">Revenue over time ({granularity}).</div>
            </div>
            <span className="badge gray">{salesOverTime.length} points</span>
          </div>
          <div style={{ height: 280, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#a3e635" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="vendor-meta" style={{ alignItems: "center" }}>
            <div>
              <div className="title">What was sold</div>
              <div className="subtitle">Top items by quantity (from purchases).</div>
            </div>
            <span className="badge gray">{soldBreakdown.length} items</span>
          </div>
          <div style={{ height: 280, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={soldBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {soldBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="vendor-meta" style={{ alignItems: "center" }}>
            <div>
              <div className="title">Order history overview</div>
              <div className="subtitle">Status counts for order requests.</div>
            </div>
            <span className="badge gray">Live</span>
          </div>
          <div className="status-grid" style={{ marginTop: 14 }}>
            {Object.entries(statusCounts).map(([k, v]) => (
              <div key={k} className="status-chip">
                <span style={{ fontWeight: 950, textTransform: "capitalize" }}>{k}</span>
                <span className="badge gray">{v}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 220, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(statusCounts).map(([status, count]) => ({ status, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.12)" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Orders" fill="#60a5fa" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="vendor-meta" style={{ alignItems: "center" }}>
            <div>
              <div className="title">Top performing products</div>
              <div className="subtitle">Best sellers by revenue.</div>
            </div>
            <span className="badge gray">{topProducts.length} shown</span>
          </div>
          <div style={{ height: 260, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.slice().reverse()} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.12)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#a3e635" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {topProducts.map((p) => (
              <div key={p.name} className="top-product-row">
                <div style={{ fontWeight: 900 }}>{p.name}</div>
                <div className="vendor-sub">{p.qty} sold · {formatMoney(p.revenue)}</div>
              </div>
            ))}
            {topProducts.length === 0 ? <div className="subtitle">No purchase data yet. Accept an order to start tracking.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

