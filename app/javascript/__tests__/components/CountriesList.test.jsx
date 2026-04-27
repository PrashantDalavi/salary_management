import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CountriesList from "../../components/Countries/CountriesList";
import {
  fetchCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from "../../services/api";

jest.mock("../../services/api", () => ({
  fetchCountries: jest.fn(),
  createCountry: jest.fn(),
  updateCountry: jest.fn(),
  deleteCountry: jest.fn(),
}));

describe("CountriesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders country rows", async () => {
    fetchCountries.mockResolvedValueOnce([
      { id: 1, name: "India", code: "IN" },
      { id: 2, name: "Japan", code: "JP" },
    ]);

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("India")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("2 countries")).toBeInTheDocument();
  });

  it("opens add modal and creates a country", async () => {
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
    createCountry.mockResolvedValue({ id: 2, name: "Germany", code: "DE" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("+ Add Country"));

    expect(screen.getByText("Add Country")).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    const nameInput = inputs.find(input => input.getAttribute("name") === "name");
    const codeInput = inputs.find(input => input.getAttribute("name") === "code");
    fireEvent.change(nameInput, { target: { name: "name", value: "Germany" } });
    fireEvent.change(codeInput, { target: { name: "code", value: "DE" } });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(createCountry).toHaveBeenCalledWith({ name: "Germany", code: "DE" });
    });
  });

  it("opens edit modal and updates a country", async () => {
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
    updateCountry.mockResolvedValue({ id: 1, name: "Republic of India", code: "IN" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText("Edit Country")).toBeInTheDocument();
    expect(screen.getByDisplayValue("India")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("India"), { target: { name: "name", value: "Republic of India" } });
    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(updateCountry).toHaveBeenCalledWith(1, { name: "Republic of India", code: "IN" });
    });
  });

  it("opens delete confirmation and deletes a country", async () => {
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
    deleteCountry.mockResolvedValue({});

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByText("Delete Country")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete").find(btn => btn.closest(".modal-footer")));

    await waitFor(() => {
      expect(deleteCountry).toHaveBeenCalledWith(1);
    });
  });

  it("filters countries by global search", async () => {
    fetchCountries.mockResolvedValueOnce([
      { id: 1, name: "India", code: "IN" },
      { id: 2, name: "Japan", code: "JP" },
    ]);

    render(<CountriesList globalSearch="japan" />);

    await waitFor(() => {
      expect(screen.getByText("Japan")).toBeInTheDocument();
      expect(screen.queryByText("India")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no countries", async () => {
    fetchCountries.mockResolvedValueOnce([]);

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("No countries found")).toBeInTheDocument();
  });
});
