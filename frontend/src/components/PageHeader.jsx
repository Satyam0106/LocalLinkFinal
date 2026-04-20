import React from "react";

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="card page-header">
      <div className="page-header-inner">
        <div className="page-header-text">
          <div className="title" style={{ fontSize: 18 }}>
            {title}
          </div>
          {subtitle ? <div className="subtitle">{subtitle}</div> : null}
        </div>
        {right ? <div className="page-header-actions">{right}</div> : null}
      </div>
    </div>
  );
}

