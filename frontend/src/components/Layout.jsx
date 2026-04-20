import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { useCart } from "../app/cart/CartContext.jsx";
import { apiFetch } from "../services/api.js";

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6l-1-3H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

export default function Layout() {
  const { user, token, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [pName, setPName] = useState("");
  const [pLocation, setPLocation] = useState("");
  const [pPhone, setPPhone] = useState("");

  const isCustomer = user?.role === "customer";

  useEffect(() => {
    setSearchText(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setProfileError("");
  }, [location.pathname]);

  useEffect(() => {
    setPName(user?.name ?? "");
    setPLocation(user?.profile?.location ?? user?.location ?? "");
    setPPhone(user?.profile?.phone ?? user?.phone ?? "");
  }, [user]);

  function updateCustomerSearch(value) {
    setSearchText(value);
    const trimmed = value.trim();
    const next = new URLSearchParams();
    const currentCategory = searchParams.get("category");
    if (trimmed) next.set("q", trimmed);
    if (currentCategory) next.set("category", currentCategory);
    const query = next.toString();
    navigate(`/vendors${query ? `?${query}` : ""}`, { replace: location.pathname === "/vendors" });
  }

  const role = user?.role === "vendor" ? "vendor" : "customer";
  const showCart = isCustomer;

  return (
    <div data-role={role}>
      <div className="header">
        <div className="header-inner">
          <div className="topbar-left">
            <div className="nav-left">
              <button
                type="button"
                className="nav-icon-btn nav-hamburger"
                aria-label="Open menu"
                title="Menu"
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon />
              </button>
              <Link to="/" className="brand" aria-label="Home">
                <span className="brand-dot" aria-hidden="true" />
                <span className="brand-text">Localink</span>
              </Link>
            </div>
            <div className="topbar-meta muted" aria-label="Account context">
              <span className="topbar-meta-role">{isCustomer ? "Customer" : "Vendor"}</span>
              <span className="topbar-meta-sep">·</span>
              <span className="topbar-meta-loc">{user?.location || "Location not set"}</span>
            </div>
          </div>

          {isCustomer ? (
            <div className="search" aria-label="Search vendors">
              <SearchIcon />
              <input
                className="input"
                placeholder="Search vendors, categories, or location"
                value={searchText}
                onChange={(e) => updateCustomerSearch(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <div className="nav-actions" aria-label="Top navigation">
            {showCart ? (
              <Link className="nav-icon-btn" to="/cart" aria-label="Open cart" title="Cart">
                <CartIcon />
                {count ? <span className="nav-badge">{count}</span> : null}
              </Link>
            ) : null}

            <button
              type="button"
              className="nav-icon-btn"
              aria-label="Profile"
              title="Profile"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <UserIcon />
            </button>

            <button
              type="button"
              className="nav-icon-btn"
              aria-label="Logout"
              title="Logout"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
            >
              <LogoutIcon />
            </button>

            {profileOpen ? (
              <div className="nav-popover" role="dialog" aria-label="Edit profile">
                <div className="nav-popover-title">Edit profile</div>
                {profileError ? <div className="nav-popover-error">{profileError}</div> : null}
                <div className="nav-popover-grid">
                  <label className="nav-popover-field">
                    <span className="nav-popover-label">Name</span>
                    <input className="input" value={pName} onChange={(e) => setPName(e.target.value)} />
                  </label>
                  <label className="nav-popover-field">
                    <span className="nav-popover-label">Location</span>
                    <input className="input" value={pLocation} onChange={(e) => setPLocation(e.target.value)} />
                  </label>
                  <label className="nav-popover-field">
                    <span className="nav-popover-label">Phone</span>
                    <input className="input" value={pPhone} onChange={(e) => setPPhone(e.target.value)} />
                  </label>
                </div>
                <div className="nav-popover-actions">
                  <button type="button" className="btn secondary" onClick={() => setProfileOpen(false)}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={profileBusy || !token}
                    onClick={async () => {
                      if (!token) return;
                      setProfileBusy(true);
                      setProfileError("");
                      try {
                        await apiFetch("/profile/me", {
                          token,
                          method: "PATCH",
                          body: { name: pName, location: pLocation, phone: pPhone },
                        });
                        setProfileOpen(false);
                      } catch (err) {
                        setProfileError(err?.message || "Could not update profile");
                      } finally {
                        setProfileBusy(false);
                      }
                    }}
                  >
                    {profileBusy ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="nav-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <div className="nav-drawer" role="dialog" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div className="nav-drawer-head">
              <div className="nav-drawer-title">Menu</div>
              <button type="button" className="nav-icon-btn" aria-label="Close menu" title="Close" onClick={() => setMenuOpen(false)}>
                ✕
              </button>
            </div>

            {isCustomer ? (
              <div className="nav-drawer-search">
                <div className="subtitle">Search</div>
                <input
                  className="input"
                  placeholder="Search vendors, categories, or location"
                  value={searchText}
                  onChange={(e) => updateCustomerSearch(e.target.value)}
                />
              </div>
            ) : null}

            <div className="nav-drawer-links">
              {user?.role === "vendor" ? (
                <>
                  <Link className="nav-drawer-link" to="/vendor/dashboard">
                    Dashboard
                  </Link>
                  <Link className="nav-drawer-link" to="/vendor/analytics">
                    Analytics
                  </Link>
                </>
              ) : (
                <Link className="nav-drawer-link" to="/vendors">
                  Browse vendors
                </Link>
              )}
              {showCart ? (
                <Link className="nav-drawer-link" to="/cart">
                  Cart
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}
