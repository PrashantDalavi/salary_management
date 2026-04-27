import React, { useState, useEffect, useRef } from "react";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, fetchDepartments, fetchCountries } from "../../services/api";
import Modal from "../common/Modal";
import Pagination from "../common/Pagination";

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "", employee_code: "",
    department_id: "", country_id: "", job_title: "", hire_date: "",
    salary: "", currency: "INR", active: true
  });
  const [formErrors, setFormErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadEmployees();
    loadDepartmentsAndCountries();
  }, [page]);

  async function loadEmployees() {
    try {
      const data = await fetchEmployees({ page, perPage });
      setEmployees(data.employees || []);
      if (data.page) {
        setTotalPages(data.total_pages);
        setTotalCount(data.total);
      }
    } catch {
      setEmployees([]);
    }
  }

  async function loadDepartmentsAndCountries() {
    try {
      const [deptData, countryData] = await Promise.all([
        fetchDepartments({ page: 1, perPage: 1000 }),
        fetchCountries({ page: 1, perPage: 1000 })
      ]);
      setDepartments(deptData.departments || []);
      setCountries(countryData.countries || []);
    } catch {
      setDepartments([]);
      setCountries([]);
    }
  }

  function handleAdd() {
    setEditingEmployee(null);
    setFormData({
      first_name: "", last_name: "", email: "", phone: "", employee_code: "",
      department_id: "", country_id: "", job_title: "", hire_date: "",
      salary: "", currency: "INR", active: true
    });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleEdit(employee) {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || "",
      employee_code: employee.employee_code || "",
      department_id: employee.department?.id || "",
      country_id: employee.country?.id || "",
      job_title: employee.job_title,
      hire_date: employee.hire_date,
      salary: employee.salary,
      currency: employee.currency || "INR",
      active: employee.active !== false
    });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormErrors([]);

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await createEmployee(formData);
      }
      setShowForm(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      loadEmployees();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingEmployee(null);
    setFormErrors([]);
  }

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
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Employee</button>
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
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(emp)}>Delete</button>
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

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal
          title={editingEmployee ? "Edit Employee" : "Add Employee"}
          onClose={closeForm}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {editingEmployee ? "Update" : "Create"}
              </button>
            </>
          }
        >
          {formErrors.length > 0 && (
            <div style={{ color: "var(--color-danger)", marginBottom: "var(--space-lg)", fontSize: "var(--font-size-sm)" }}>
              {formErrors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="first_name">First Name</label>
                <input className="form-input" id="first_name" name="first_name" value={formData.first_name} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="last_name">Last Name</label>
                <input className="form-input" id="last_name" name="last_name" value={formData.last_name} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input className="form-input" type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="employee_code">Employee Code</label>
                <input className="form-input" id="employee_code" name="employee_code" value={formData.employee_code} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="department_id">Department</label>
                <select className="form-input" id="department_id" name="department_id" value={formData.department_id} onChange={handleFormChange} required>
                  <option value="" disabled>Select a department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="country_id">Country</label>
                <select className="form-input" id="country_id" name="country_id" value={formData.country_id} onChange={handleFormChange} required>
                  <option value="" disabled>Select a country</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="job_title">Job Title</label>
                <input className="form-input" id="job_title" name="job_title" value={formData.job_title} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hire_date">Hire Date</label>
                <input className="form-input" type="date" id="hire_date" name="hire_date" value={formData.hire_date} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="salary">Salary</label>
                <input className="form-input" type="number" step="0.01" id="salary" name="salary" value={formData.salary} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="currency">Currency</label>
                <input className="form-input" id="currency" name="currency" value={formData.currency} onChange={handleFormChange} required />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          title="Delete Employee"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p className="confirm-text">
            Are you sure you want to delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
