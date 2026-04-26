import React from "react";

export default function Sidebar({ activeView, onNavigate }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊", badge: null },
    { key: "countries", label: "Countries", icon: "🌍", badge: null },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Salary Management</h1>
        <span>Admin Panel</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-nav-item ${activeView === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>
    </aside>
  );
}
