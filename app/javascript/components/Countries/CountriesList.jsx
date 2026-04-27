import React, { useState, useEffect, useRef } from "react";
import { fetchCountries, createCountry, updateCountry, deleteCountry, bulkImportCountries } from "../../services/api";
import Modal from "../common/Modal";

export default function CountriesList({ globalSearch }) {
  const [countries, setCountries] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [formErrors, setFormErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCountries();
  }, []);

  async function loadCountries() {
    try {
      const data = await fetchCountries();
      setCountries(data);
    } catch {
      setCountries([]);
    }
  }

  const filtered = countries
    .filter(c => {
      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    })
    .sort((a, b) => {
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
    setEditingCountry(null);
    setFormData({ name: "", code: "" });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleEdit(country) {
    setEditingCountry(country);
    setFormData({ name: country.name, code: country.code });
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
      if (editingCountry) {
        await updateCountry(editingCountry.id, formData);
      } else {
        await createCountry(formData);
      }
      setShowForm(false);
      setEditingCountry(null);
      loadCountries();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCountry(deleteTarget.id);
      setDeleteTarget(null);
      loadCountries();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingCountry(null);
    setFormErrors([]);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result = await bulkImportCountries(file);
      setImportResult(result);
      loadCountries();
    } catch (err) {
      setImportResult({ message: err.message, imported: 0, skipped: 0 });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Countries</h2>
          <div className="page-header-subtitle">{filtered.length} countries</div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
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
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Country</button>
        </div>
      </div>

      {importResult && (
        <div style={{
          padding: "var(--space-md) var(--space-lg)",
          marginBottom: "var(--space-lg)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--font-size-sm)",
          background: importResult.imported > 0 ? "#ecfdf5" : "#fef2f2",
          color: importResult.imported > 0 ? "#065f46" : "#991b1b",
          border: `1px solid ${importResult.imported > 0 ? "#a7f3d0" : "#fecaca"}`
        }}>
          {importResult.message} — Imported: {importResult.imported}, Updated: {importResult.updated || 0}, Skipped: {importResult.skipped}
          {importResult.errors?.length > 0 && (
            <div style={{ marginTop: "var(--space-xs)" }}>
              {importResult.errors.map((err, i) => <div key={i}>• {err}</div>)}
            </div>
          )}
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID {renderSortIndicator("id")}</th>
              <th onClick={() => handleSort("name")}>Name {renderSortIndicator("name")}</th>
              <th onClick={() => handleSort("code")}>Code {renderSortIndicator("code")}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="4"><div className="empty-state"><div className="empty-state-icon">🌍</div>No countries found</div></td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td className="cell-name">{c.name}</td>
                  <td><span className="cell-badge badge-engineering">{c.code}</span></td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal
          title={editingCountry ? "Edit Country" : "Add Country"}
          onClose={closeForm}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {editingCountry ? "Update" : "Create"}
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
              <input className="form-input" name="code" value={formData.code} onChange={handleFormChange} required maxLength={5} />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          title="Delete Country"
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
