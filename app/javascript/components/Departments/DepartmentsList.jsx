import React, { useState, useEffect } from "react";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment, fetchCountries } from "../../services/api";
import Modal from "../common/Modal";
import Pagination from "../common/Pagination";

export default function DepartmentsList() {
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", country_id: "" });
  const [formErrors, setFormErrors] = useState([]);

  useEffect(() => {
    loadDepartments();
    loadCountries();
  }, [page]);

  async function loadDepartments() {
    try {
      const data = await fetchDepartments({ page, perPage });
      setDepartments(data.departments || []);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
        setTotalCount(data.pagination.total_count);
      }
    } catch {
      setDepartments([]);
    }
  }

  async function loadCountries() {
    try {
      // Fetch a large number of countries for the dropdown to avoid missing any (or could use search)
      const data = await fetchCountries({ page: 1, perPage: 1000 });
      setCountries(data.countries || []);
    } catch {
      setCountries([]);
    }
  }

  const sorted = [...departments].sort((a, b) => {
    const valA = typeof a[sortBy] === "string" ? a[sortBy].toLowerCase() : a[sortBy];
    const valB = typeof b[sortBy] === "string" ? b[sortBy].toLowerCase() : b[sortBy];
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  function renderSortIndicator(col) {
    if (sortBy !== col) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function handleAdd() {
    setEditingDepartment(null);
    setFormData({ name: "", code: "", country_id: "" });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleEdit(department) {
    setEditingDepartment(department);
    setFormData({ name: department.name, code: department.code, country_id: department.country?.id || "" });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormErrors([]);

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, formData);
      } else {
        await createDepartment(formData);
      }
      setShowForm(false);
      setEditingDepartment(null);
      loadDepartments();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDepartment(deleteTarget.id);
      setDeleteTarget(null);
      loadDepartments();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingDepartment(null);
    setFormErrors([]);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Departments</h2>
          <div className="page-header-subtitle">{totalCount} departments</div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Department</button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID {renderSortIndicator("id")}</th>
              <th onClick={() => handleSort("name")}>Name {renderSortIndicator("name")}</th>
              <th onClick={() => handleSort("code")}>Code {renderSortIndicator("code")}</th>
              <th>Country</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan="5"><div className="empty-state"><div className="empty-state-icon">🏢</div>No departments found</div></td></tr>
            ) : (
              sorted.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td className="cell-name">{d.name}</td>
                  <td><span className="cell-badge badge-engineering">{d.code}</span></td>
                  <td>{d.country?.name} ({d.country?.code})</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(d)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)}>Delete</button>
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
          title={editingDepartment ? "Edit Department" : "Add Department"}
          onClose={closeForm}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {editingDepartment ? "Update" : "Create"}
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
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" name="name" value={formData.name} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" name="code" value={formData.code} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-input" name="country_id" value={formData.country_id} onChange={handleFormChange} required>
                <option value="" disabled>Select a country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          title="Delete Department"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p className="confirm-text">
            Are you sure you want to delete <strong>{deleteTarget.name} ({deleteTarget.code})</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
