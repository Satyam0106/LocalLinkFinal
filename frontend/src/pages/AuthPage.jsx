import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { Field } from "../components/Field.jsx";
import "./AuthPage.css";

const HIGHLIGHTS = [
  { title: "Order from nearby vendors", text: "Discover trusted local sellers, browse products, and place requests in a few taps." },
  { title: "Chat before you buy", text: "Customers and vendors can talk inside Local Link for quick clarifications and updates." },
  { title: "Built for neighborhood trade", text: "Simple flows for groceries, services, repairs, bakery orders, and more." },
];

export function AuthPage() {
  const { login, signup, token } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (mode === "signup" && !name) return false;
    if (mode === "signup" && role === "vendor" && (!category || !location || !phone)) return false;
    return true;
  }, [email, password, mode, name, role, category, location, phone]);

  if (token) {
    setTimeout(() => navigate("/"), 0);
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await signup({
          name,
          email,
          password,
          role,
          category: role === "vendor" ? category : undefined,
          location,
          phone: role === "vendor" ? phone : undefined,
        });
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a href="#home" className="landing-brand">
          <span className="landing-brand-mark" aria-hidden="true" />
          <span>Local Link</span>
        </a>
        <nav className="landing-links" aria-label="Landing navigation">
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#join">Join Now</a>
        </nav>
        <a href="#join" className="btn landing-join-btn">
          Join Now
        </a>
      </header>

      <main>
        <section id="home" className="hero-section">
          <div className="hero-shell">
            <div className="hero-copy">
              <div className="hero-kicker">Neighborhood commerce, reimagined</div>
              <h1 className="hero-heading">
                Local Link
                <span>connects customers and vendors in one easy flow.</span>
              </h1>
              <p className="hero-text">
                Browse nearby shops, chat directly with vendors, place product orders, and manage requests from one clean marketplace.
              </p>
              <div className="hero-actions">
                <a href="#join" className="btn">
                  Join Now
                </a>
                <a href="#about" className="btn secondary">
                  About Us
                </a>
              </div>
              <div className="hero-metrics" aria-label="Highlights">
                <div className="hero-metric">
                  <strong>Customer first</strong>
                  <span>Search, chat, cart, and order in one place.</span>
                </div>
                <div className="hero-metric">
                  <strong>Vendor ready</strong>
                  <span>Accept requests, manage products, and reply fast.</span>
                </div>
              </div>
            </div>

            <div className="hero-media">
              <div className="hero-video-card">
                <video
                  className="hero-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  poster="/hero-market.png"
                >
                  <source src="/localink-hero.mp4" type="video/mp4" />
                </video>
                <div className="hero-video-caption">
                  Local vendors, faster discovery, smoother communication.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="landing-section-head">
            <div className="hero-kicker">About Us</div>
            <h2>Built to make local shopping easier to access</h2>
            <p>
              Local Link is designed for quick discovery, clear communication, and simpler neighborhood buying for both customers and vendors.
            </p>
          </div>

          <div className="about-grid">
            {HIGHLIGHTS.map((item) => (
              <article key={item.title} className="about-card">
                <div className="about-card-index" aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="join" className="join-section">
          <div className="join-layout">
            <div className="join-copy">
              <div className="hero-kicker">Join Local Link</div>
              <h2>Start as a customer or onboard your shop today.</h2>
              <p>
                The form below gives you one clear entry point. Sign in if you already have an account, or create one in a few steps.
              </p>
              <ul className="join-points">
                <li>Accessible form layout with clear labels and grouped actions</li>
                <li>Vendor onboarding with category, location, and phone details</li>
                <li>Customer access to search, orders, chat, and direct calling</li>
              </ul>
            </div>

            <div className="card auth-card landing-auth-card">
              <div className="auth-card-top">
                <div>
                  <div className="auth-title">Get Started</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {mode === "login" ? "Welcome back to Local Link" : "Create your Local Link account"}
                  </div>
                </div>
                <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
                  <button
                    className={`btn ${mode === "login" ? "" : "ghost"}`}
                    onClick={() => setMode("login")}
                    type="button"
                  >
                    Login
                  </button>
                  <button
                    className={`btn ${mode === "signup" ? "" : "ghost"}`}
                    onClick={() => setMode("signup")}
                    type="button"
                  >
                    Signup
                  </button>
                </div>
              </div>

              <form onSubmit={onSubmit} className="auth-form">
                {mode === "signup" ? (
                  <Field label="Name">
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </Field>
                ) : null}

                <Field label="Role">
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
                    <option value="customer">customer</option>
                    <option value="vendor">vendor</option>
                  </select>
                </Field>

                <Field label="Email">
                  <input
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                  />
                </Field>

                <Field label="Password">
                  <input
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </Field>

                {mode === "signup" && role === "vendor" ? (
                  <>
                    <Field label="Category" hint="Bakery, Repairs, Grocery, Services">
                      <input
                        className="input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Bakery"
                      />
                    </Field>
                    <Field label="Location" hint="Where customers can find you">
                      <input
                        className="input"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="San Francisco, CA"
                        autoComplete="address-level2"
                      />
                    </Field>
                    <Field label="Phone" hint="Used for direct customer calling">
                      <input
                        className="input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        type="tel"
                        autoComplete="tel"
                      />
                    </Field>
                  </>
                ) : mode === "signup" ? (
                  <Field label="Location (optional)">
                    <input
                      className="input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="San Francisco, CA"
                      autoComplete="address-level2"
                    />
                  </Field>
                ) : null}

                {error ? <div className="danger">{error}</div> : null}

                <button className="btn auth-submit-btn" disabled={!canSubmit || busy} type="submit">
                  {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
