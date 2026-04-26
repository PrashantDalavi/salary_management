import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';

describe('Dashboard Component', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('Total Departments')).toBeInTheDocument();
    expect(screen.getByText('Total Countries')).toBeInTheDocument();
    expect(screen.getByText('Avg Salary')).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome to the Salary Management System')).toBeInTheDocument();
  });
});
