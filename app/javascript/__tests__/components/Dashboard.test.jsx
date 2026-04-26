import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';

describe('Dashboard Component', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders page header container', () => {
    render(<Dashboard />);
    expect(document.querySelector('.page-header')).toBeInTheDocument();
  });
});
