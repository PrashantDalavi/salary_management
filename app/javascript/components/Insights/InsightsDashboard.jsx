import React, { useState, useEffect } from "react";
import { fetchSalaryInsights, fetchCountries } from "../../services/api";

export default function InsightsDashboard() {
  const [insights, setInsights] = useState(null);
  const [countries, setCountries] = useState([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [sortBy, setSortBy] = useState("employee_count");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    fetchCountries({ perPage: 1000 }).then(res => setCountries(res.countries || res));
  }, []);

  useEffect(() => {
    fetchSalaryInsights({ countryId: countryFilter }).then(setInsights);
  }, [countryFilter]);

  function formatSalary(val) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val);
  }

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function renderSortIndicator(col) {
    if (sortBy !== col) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  if (!insights) return <div className="page-content"><p>Loading...</p></div>;

  const sortedCountryInsights = [...insights.by_country].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const sortedJobInsights = [...insights.by_job_title].sort((a, b) => {
    const valA = typeof a[sortBy] === "string" ? a[sortBy].toLowerCase() : a[sortBy];
    const valB = typeof b[sortBy] === "string" ? b[sortBy].toLowerCase() : b[sortBy];
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Salary Insights</h2>
          <div className="page-header-subtitle">Compensation analytics across the organization</div>
        </div>
        <select
          className="table-filter-select"
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Overall Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Employees</div>
          <div className="stat-card-value">{insights.overall.total_employees.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Salary</div>
          <div className="stat-card-value">{formatSalary(insights.overall.avg_salary)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Min Salary</div>
          <div className="stat-card-value">{formatSalary(insights.overall.min_salary)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Max Salary</div>
          <div className="stat-card-value">{formatSalary(insights.overall.max_salary)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Countries</div>
          <div className="stat-card-value">{insights.overall.total_countries}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Departments</div>
          <div className="stat-card-value">{insights.overall.total_departments}</div>
        </div>
      </div>

      {/* By Country Table */}
      <div className="page-header" style={{ marginTop: "var(--space-xl)" }}>
        <h2 style={{ fontSize: "var(--font-size-lg)" }}>By Country</h2>
      </div>
      <div className="data-table-wrapper" style={{ marginBottom: "var(--space-2xl)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("country")}>Country {renderSortIndicator("country")}</th>
              <th onClick={() => handleSort("employee_count")}>Employees {renderSortIndicator("employee_count")}</th>
              <th onClick={() => handleSort("min_salary")}>Min Salary {renderSortIndicator("min_salary")}</th>
              <th onClick={() => handleSort("max_salary")}>Max Salary {renderSortIndicator("max_salary")}</th>
              <th onClick={() => handleSort("avg_salary")}>Avg Salary {renderSortIndicator("avg_salary")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedCountryInsights.map(row => (
              <tr key={row.country}>
                <td className="cell-name">{row.country}</td>
                <td>{row.employee_count}</td>
                <td className="cell-salary">{formatSalary(row.min_salary)}</td>
                <td className="cell-salary">{formatSalary(row.max_salary)}</td>
                <td className="cell-salary">{formatSalary(row.avg_salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* By Job Title Table */}
      <div className="page-header">
        <h2 style={{ fontSize: "var(--font-size-lg)" }}>By Job Title</h2>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("job_title")}>Job Title {renderSortIndicator("job_title")}</th>
              <th onClick={() => handleSort("country")}>Country {renderSortIndicator("country")}</th>
              <th onClick={() => handleSort("employee_count")}>Employees {renderSortIndicator("employee_count")}</th>
              <th onClick={() => handleSort("avg_salary")}>Avg Salary {renderSortIndicator("avg_salary")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedJobInsights.slice(0, 20).map((row, i) => (
              <tr key={i}>
                <td className="cell-name">{row.job_title}</td>
                <td>{row.country}</td>
                <td>{row.employee_count}</td>
                <td className="cell-salary">{formatSalary(row.avg_salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
