import React, { useRef, useState } from "react";
import Pagination from "../common/Pagination";

export default function EmployeesList() {
  const [employees] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages] = useState(0);
  const [totalCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    // TODO: call bulk import API
    setTimeout(() => {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 500);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <div className="page-header-subtitle">{totalCount} employees</div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importing..." : "📥 Import CSV/Excel"}
          </button>
          <button className="btn btn-primary" disabled>+ Add Employee</button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Code</th>
              <th>Department</th>
              <th>Country</th>
              <th>Salary</th>
              <th>Job Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <div className="empty-state-icon">👤</div>
                    No employees found
                  </div>
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td className="cell-name">{emp.first_name}</td>
                  <td className="cell-name">{emp.last_name}</td>
                  <td>{emp.email}</td>
                  <td><span className="cell-badge badge-engineering">{emp.employee_code}</span></td>
                  <td>{emp.department?.name || "—"}</td>
                  <td>{emp.country?.name || "—"}</td>
                  <td>{emp.currency} {Number(emp.salary).toLocaleString()}</td>
                  <td>{emp.job_title}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-sm" disabled>Edit</button>
                      <button className="btn btn-danger btn-sm" disabled>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={totalCount}
          perPage={perPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
