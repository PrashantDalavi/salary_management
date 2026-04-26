import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CountriesList from "../../components/Countries/CountriesList";
import {
  createCountry,
  deleteCountry,
  getCountries,
  getCountry,
  updateCountry,
} from "../../api/countries";

jest.mock("../../api/countries", () => ({
  getCountries: jest.fn(),
  getCountry: jest.fn(),
  createCountry: jest.fn(),
  updateCountry: jest.fn(),
  deleteCountry: jest.fn(),
}));

describe("CountriesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it("renders index rows and pagination info", async () => {
    getCountries.mockResolvedValueOnce({
      countries: [
        { id: 1, name: "India", code: "IN" },
        { id: 2, name: "Japan", code: "JP" },
      ],
      pagination: { current_page: 1, per_page: 10, total_count: 2, total_pages: 1 },
    });

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("India")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1 (2 total)")).toBeInTheDocument();
  });

  it("creates a country", async () => {
    getCountries.mockResolvedValue({
      countries: [{ id: 1, name: "India", code: "IN" }],
      pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
    });
    createCountry.mockResolvedValue({ id: 2, name: "Germany", code: "DE" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("+ Add Country"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Germany" } });
    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "de" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(createCountry).toHaveBeenCalledWith({ name: "Germany", code: "DE" });
    });
  });

  it("shows country details", async () => {
    getCountries.mockResolvedValueOnce({
      countries: [{ id: 1, name: "India", code: "IN" }],
      pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
    });
    getCountry.mockResolvedValueOnce({ id: 1, name: "India", code: "IN" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("View"));

    expect(await screen.findByText("Country Details")).toBeInTheDocument();
    expect(screen.getByText("ID:")).toBeInTheDocument();
  });

  it("updates a country", async () => {
    getCountries.mockResolvedValue({
      countries: [{ id: 1, name: "India", code: "IN" }],
      pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
    });
    updateCountry.mockResolvedValue({ id: 1, name: "Republic of India", code: "IN" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Republic of India" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(updateCountry).toHaveBeenCalledWith(1, { name: "Republic of India", code: "IN" });
    });
  });

  it("deletes a country", async () => {
    getCountries.mockResolvedValue({
      countries: [{ id: 1, name: "India", code: "IN" }],
      pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
    });
    deleteCountry.mockResolvedValue(true);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(deleteCountry).toHaveBeenCalledWith(1);
    });
  });

  it("moves to next page and refetches data", async () => {
    getCountries
      .mockResolvedValueOnce({
        countries: [{ id: 1, name: "India", code: "IN" }],
        pagination: { current_page: 1, per_page: 10, total_count: 11, total_pages: 2 },
      })
      .mockResolvedValueOnce({
        countries: [{ id: 11, name: "Japan", code: "JP" }],
        pagination: { current_page: 2, per_page: 10, total_count: 11, total_pages: 2 },
      });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(getCountries).toHaveBeenNthCalledWith(2, { page: 2, perPage: 10 });
    });
  });
});
