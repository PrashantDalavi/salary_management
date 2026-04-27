import React from "react";

export default function Sidebar({ activeView, onNavigate }) {
  const navItems = [
    { key: "countries", label: "Countries", icon: "🌍", badge: null },
    { key: "departments", label: "Departments", icon: "🏢", badge: null },
    { key: "employees", label: "Employees", icon: "👤", badge: null },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>SalaryMgr</h1>
        <span>Admin Panel</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Data Management</div>
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
