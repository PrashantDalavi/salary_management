import React, { useState } from "react";
import Sidebar from "./Layout/Sidebar";
import Header from "./Layout/Header";
import CountriesList from "./Countries/CountriesList";

export default function App() {
  const [activeView, setActiveView] = useState("countries");
  const [globalSearch, setGlobalSearch] = useState("");

  function renderContent() {
    switch (activeView) {
      case "countries":
        return <CountriesList globalSearch={globalSearch} />;
      default:
        return <CountriesList globalSearch={globalSearch} />;
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
