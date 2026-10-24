import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '../components/StatCard';
import { DollarSign } from 'lucide-react';

describe('StatCard component', () => {
  it('renders title, formatted value, and subtitle', () => {
    render(
      <StatCard
        title="Total Valuation"
        value="$1,250,000"
        subtitle="Across all vehicles"
        icon={DollarSign}
        badge={{ text: 'Active Portfolio', variant: 'info' }}
      />
    );

    expect(screen.getByText('Total Valuation')).toBeInTheDocument();
    expect(screen.getByText('$1,250,000')).toBeInTheDocument();
    expect(screen.getByText('Across all vehicles')).toBeInTheDocument();
    expect(screen.getByText('Active Portfolio')).toBeInTheDocument();
  });
});
