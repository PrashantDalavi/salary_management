import React, { useEffect, useMemo, useState } from "react";
import {
  createCountry,
  deleteCountry,
  getCountries,
  getCountry,
  updateCountry,
} from "../../api/countries";

const DEFAULT_FORM = { name: "", code: "" };

export default function CountriesList({ globalSearch }) {
  const [countries, setCountries] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [editingCountryId, setEditingCountryId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCountries(pagination.current_page, pagination.per_page);
  }, [pagination.current_page, pagination.per_page]);

  async function loadCountries(page, perPage) {
    setLoading(true);
    setError("");

    try {
      const response = await getCountries({ page, perPage });
      setCountries(response.countries || []);
      setPagination(prev => ({
        ...prev,
        ...(response.pagination || {}),
      }));
    } catch (err) {
      setError(err.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }

  const filteredCountries = useMemo(() => {
    const query = (globalSearch || "").trim().toLowerCase();
    if (!query) return countries;

    return countries.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query),
    );
  }, [countries, globalSearch]);

  function openCreateModal() {
    setFormMode("create");
    setEditingCountryId(null);
    setFormData(DEFAULT_FORM);
    setFormOpen(true);
  }

  function openEditModal(country) {
    setFormMode("edit");
    setEditingCountryId(country.id);
    setFormData({ name: country.name, code: country.code });
    setFormOpen(true);
  }

  async function openShowModal(countryId) {
    setError("");
    try {
      const country = await getCountry(countryId);
      setSelectedCountry(country);
    } catch (err) {
      setError(err.message || "Failed to fetch country");
    }
  }

  function closeFormModal() {
    setFormOpen(false);
    setFormData(DEFAULT_FORM);
    setEditingCountryId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (formMode === "edit" && editingCountryId) {
        await updateCountry(editingCountryId, formData);
      } else {
        await createCountry(formData);
      }

      closeFormModal();
      await loadCountries(pagination.current_page, pagination.per_page);
    } catch (err) {
      setError(err.message || "Failed to save country");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(countryId) {
    const confirmed = window.confirm("Delete this country?");
    if (!confirmed) return;

    setError("");

    try {
      await deleteCountry(countryId);
      await loadCountries(pagination.current_page, pagination.per_page);
    } catch (err) {
      setError(err.message || "Failed to delete country");
    }
  }

  async function goToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > pagination.total_pages || pageNumber === pagination.current_page) {
      return;
    }

    setPagination(prev => ({
      ...prev,
      current_page: pageNumber,
    }));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Countries</h2>
          <p className="page-header-subtitle">Manage country records</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Add Country
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Loading...</td>
              </tr>
            ) : filteredCountries.length === 0 ? (
              <tr>
                <td colSpan={4}>No countries found.</td>
              </tr>
            ) : (
              filteredCountries.map(country => (
                <tr key={country.id}>
                  <td>{country.id}</td>
                  <td>{country.name}</td>
                  <td>{country.code}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openShowModal(country.id)}>View</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(country)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(country.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <div className="pagination-info">
            Page {pagination.current_page} of {pagination.total_pages || 1} ({pagination.total_count} total)
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => goToPage(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
            >
              Prev
            </button>
            <button
              className="pagination-btn"
              onClick={() => goToPage(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.total_pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="modal-overlay" role="dialog" aria-label={formMode === "edit" ? "Edit Country" : "Add Country"}>
          <div className="modal">
            <div className="modal-header">
              <h3>{formMode === "edit" ? "Edit Country" : "Add Country"}</h3>
              <button className="modal-close" onClick={closeFormModal}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="country-name">Name</label>
                  <input
                    id="country-name"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="country-code">Code</label>
                  <input
                    id="country-code"
                    className="form-input"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    maxLength={3}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeFormModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCountry && (
        <div className="modal-overlay" role="dialog" aria-label="Country Details">
          <div className="modal">
            <div className="modal-header">
              <h3>Country Details</h3>
              <button className="modal-close" onClick={() => setSelectedCountry(null)}>x</button>
            </div>
            <div className="modal-body">
              <p><strong>ID:</strong> {selectedCountry.id}</p>
              <p><strong>Name:</strong> {selectedCountry.name}</p>
              <p><strong>Code:</strong> {selectedCountry.code}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCountry(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
