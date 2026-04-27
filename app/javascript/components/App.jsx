import React, { useState } from "react";
import Sidebar from "./Layout/Sidebar";
import Header from "./Layout/Header";
import CountriesList from "./Countries/CountriesList";
import DepartmentsList from "./Departments/DepartmentsList";
import InsightsDashboard from "./Insights/InsightsDashboard";
import EmployeesList from "./Employees/EmployeesList";

export default function App() {
  const [activeView, setActiveView] = useState("countries");
  const [globalSearch, setGlobalSearch] = useState("");

  function renderContent() {
    switch (activeView) {
      case "countries":
        return <CountriesList globalSearch={globalSearch} />;
      case "departments":
        return <DepartmentsList />;
      case "insights":
        return <InsightsDashboard />;
      case "employees":
        return <EmployeesList />;
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
