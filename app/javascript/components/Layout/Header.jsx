import React from "react";

export default function Header({ globalSearch, onGlobalSearchChange }) {
  return (
    <header className="header">
      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search across all tables..."
          value={globalSearch}
          onChange={e => onGlobalSearchChange(e.target.value)}
        />
      </div>
      <div className="header-actions">
        <button className="btn-icon" title="Notifications">🔔</button>
        <button className="btn-icon" title="Settings">⚙️</button>
      </div>
    </header>
  );
}
