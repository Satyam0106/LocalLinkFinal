import React from "react";

export function Field({ label, children, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        {hint ? <div className="muted" style={{ fontSize: 12 }}>{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

