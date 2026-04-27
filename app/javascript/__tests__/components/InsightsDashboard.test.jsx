import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import InsightsDashboard from "../../components/Insights/InsightsDashboard";
import * as api from "../../services/api";

jest.mock("../../services/api");

const mockCountries = [
  { id: 1, name: "India", code: "IN" },
  { id: 2, name: "United States", code: "US" },
];

const mockInsights = {
  overall: {
    total_employees: 10000,
    avg_salary: 85000,
    min_salary: 30000,
    max_salary: 200000,
    total_countries: 10,
    total_departments: 7,
  },
  by_country: [
    { country: "India", employee_count: 3000, min_salary: 30000, max_salary: 150000, avg_salary: 70000 },
    { country: "United States", employee_count: 2500, min_salary: 60000, max_salary: 200000, avg_salary: 110000 },
  ],
  by_job_title: [
    { job_title: "Software Engineer", country: "India", employee_count: 500, avg_salary: 80000 },
    { job_title: "Product Manager", country: "United States", employee_count: 200, avg_salary: 130000 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  api.fetchCountries.mockResolvedValue(mockCountries);
  api.fetchSalaryInsights.mockResolvedValue(mockInsights);
});

describe("InsightsDashboard", () => {
  test("renders overall stats cards", async () => {
    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Employees")).toBeInTheDocument();
    });

    // Check stat card values exist
    const statsGrid = document.querySelector(".stats-grid");
    expect(within(statsGrid).getByText("Total Employees")).toBeInTheDocument();
    expect(within(statsGrid).getByText("Average Salary")).toBeInTheDocument();
    expect(within(statsGrid).getByText("Countries")).toBeInTheDocument();
    expect(within(statsGrid).getByText("Departments")).toBeInTheDocument();
    expect(within(statsGrid).getByText("10")).toBeInTheDocument();
    expect(within(statsGrid).getByText("7")).toBeInTheDocument();
  });

  test("renders By Country table with data", async () => {
    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("By Country")).toBeInTheDocument();
    });

    // Use getAllByText since "India" appears in both dropdown and table
    const indiaElements = screen.getAllByText("India");
    expect(indiaElements.length).toBeGreaterThanOrEqual(2); // dropdown + table row

    expect(screen.getByText("3000")).toBeInTheDocument();
    expect(screen.getByText("2500")).toBeInTheDocument();
  });

  test("renders By Job Title table", async () => {
    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
      expect(screen.getByText("Product Manager")).toBeInTheDocument();
    });
  });

  test("shows loading state initially", () => {
    api.fetchSalaryInsights.mockReturnValue(new Promise(() => {})); // never resolves
    render(<InsightsDashboard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("fetches insights with country filter when changed", async () => {
    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("By Country")).toBeInTheDocument();
    });

    const countrySelect = screen.getByDisplayValue("All Countries");
    fireEvent.change(countrySelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(api.fetchSalaryInsights).toHaveBeenCalledWith({ countryId: "1" });
    });
  });

  test("fetches countries from dedicated endpoint", async () => {
    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(api.fetchCountries).toHaveBeenCalledTimes(1);
    });
  });
});
