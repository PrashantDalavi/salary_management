import React, { useState } from "react";
import Sidebar from "./Layout/Sidebar";
import Header from "./Layout/Header";
import Dashboard from "./Dashboard";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [globalSearch, setGlobalSearch] = useState("");

  function renderContent() {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="main-content">
        <Header
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
        />
        <div className="page-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

