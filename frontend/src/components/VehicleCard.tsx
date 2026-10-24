import React from 'react';
import { Link } from 'react-router-dom';
import { Fuel, Gauge, Cog, ShoppingCart, Eye, Edit3, AlertCircle } from 'lucide-react';
import { Vehicle } from '../types';
import { useAuth } from '../context/AuthContext';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  const isOutOfStock = vehicle.quantity === 0;
  const isLowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;

  const fallbackImage =
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMileage = (miles?: number | null) => {
    if (miles === undefined || miles === null) return '0 mi';
    return `${new Intl.NumberFormat('en-US').format(miles)} mi`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={vehicle.image_url || fallbackImage}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900/80 backdrop-blur-md text-white tracking-wide uppercase">
            {vehicle.category}
          </span>
          {vehicle.year && (
            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-white/90 backdrop-blur-md text-slate-800">
              {vehicle.year}
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600/95 backdrop-blur-md text-white shadow-sm flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/95 backdrop-blur-md text-white shadow-sm">
              Low Stock: {vehicle.quantity} left
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600/90 backdrop-blur-md text-white shadow-sm">
              In Stock: {vehicle.quantity}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-lg font-bold text-slate-900 truncate">
              {vehicle.make} {vehicle.model}
            </h4>
          </div>

          {vehicle.color && (
            <p className="text-xs text-slate-500 font-medium mb-3">Color: {vehicle.color}</p>
          )}

          {/* Quick Specifications */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-slate-600 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{formatMileage(vehicle.mileage)}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{vehicle.fuel_type || 'Gasoline'}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Cog className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{vehicle.transmission || 'Auto'}</span>
            </div>
          </div>
        </div>

        {/* Pricing and Action Buttons */}
        <div className="pt-2">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Retail Price</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(vehicle.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/inventory/${vehicle.id}`}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Details
            </Link>

            <Link
              to={isOutOfStock ? '#' : `/inventory/${vehicle.id}/purchase`}
              aria-disabled={isOutOfStock}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {isOutOfStock ? 'Sold Out' : 'Purchase'}
            </Link>

            {isAuthenticated && (
              <Link
                to={`/vehicles/${vehicle.id}/edit`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Edit vehicle specifications"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
