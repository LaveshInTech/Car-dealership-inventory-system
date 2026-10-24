import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { VehicleCard } from '../components/VehicleCard';
import { AuthProvider } from '../context/AuthContext';
import { Vehicle } from '../types';

const mockVehicleInStock: Vehicle = {
  id: 1,
  vin: 'WP0AA2A96PS298101',
  make: 'Porsche',
  model: '911 Carrera GTS',
  category: 'Coupe',
  year: 2024,
  price: 158200.0,
  quantity: 3,
  color: 'Chalk Gray',
  mileage: 1200,
  fuel_type: 'Gasoline',
  transmission: 'Automatic',
  description: 'Twin-turbocharged 3.0L flat-six producing 473 hp.',
  image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockVehicleOutOfStock: Vehicle = {
  ...mockVehicleInStock,
  id: 2,
  model: '911 GT3 (Sold Out)',
  quantity: 0,
};

describe('VehicleCard Component', () => {
  it('renders vehicle information, pricing, and In Stock status correctly', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <VehicleCard vehicle={mockVehicleInStock} />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Porsche 911 Carrera GTS')).toBeInTheDocument();
    expect(screen.getByText('Coupe')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('In Stock: 3')).toBeInTheDocument();
    expect(screen.getByText('$158,200')).toBeInTheDocument();
    expect(screen.getByText('Purchase')).toBeInTheDocument();
  });

  it('renders Out of Stock badge and disabled purchase button when quantity is 0', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <VehicleCard vehicle={mockVehicleOutOfStock} />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    const purchaseButton = screen.getByText('Sold Out');
    expect(purchaseButton).toBeInTheDocument();
    expect(purchaseButton).toHaveAttribute('aria-disabled', 'true');
  });
});
