import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Palette,
  Fingerprint,
  ShoppingCart,
  Edit3,
  ShieldCheck,
  AlertCircle,
  History,
  CheckCircle2,
} from 'lucide-react';
import { vehiclesApi, inventoryApi } from '../services/api';
import { Vehicle, InventoryTransaction } from '../types';
import { useAuth } from '../context/AuthContext';

export const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicle = async () => {
      setLoading(true);
      try {
        const data = await vehiclesApi.getVehicleById(vehicleId);
        setVehicle(data);

        // Fetch vehicle transactions
        if (isAuthenticated) {
          try {
            const txData = await inventoryApi.getTransactions({ vehicle_id: vehicleId, limit: 10 });
            setTransactions(txData.items);
          } catch (e) {
            // non-fatal if user is not authorized or error
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Vehicle not found.');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId, isAuthenticated]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded-lg w-1/2"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Vehicle Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            The vehicle listing you are trying to view does not exist or may have been removed.
          </p>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Showroom
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = vehicle.quantity === 0;
  const isLowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Showcase */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm aspect-[16/10]">
            <img
              src={vehicle.image_url || fallbackImage}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900/80 backdrop-blur-md text-white tracking-wide uppercase">
                {vehicle.category}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1.5 text-xs font-bold rounded-xl backdrop-blur-md shadow-sm ${
                isOutOfStock
                  ? 'bg-rose-600/90 text-white'
                  : isLowStock
                  ? 'bg-amber-500/95 text-white'
                  : 'bg-emerald-600/90 text-white'
              }`}>
                {isOutOfStock ? 'Sold Out' : `${vehicle.quantity} Units in Stock`}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Vehicle Overview</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {vehicle.description ||
                'No detailed description provided for this vehicle. Contact our dealership sales consultants for additional equipment lists and provenance.'}
            </p>
          </div>
        </div>

        {/* Right Column: Pricing, Specs, and Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-widest">
                {vehicle.category} • {vehicle.year || '2024'}
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                VIN: {vehicle.vin || 'VIN Unavailable'}
              </p>
            </div>

            {/* Pricing Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
                  Retail Price
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(vehicle.price)}
                </span>
              </div>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Dealer Certified
              </span>
            </div>

            {/* Key Specs Matrix */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mileage</span>
                  <span className="font-bold text-slate-800">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '0 mi'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <Fuel className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fuel Type</span>
                  <span className="font-bold text-slate-800">{vehicle.fuel_type || 'Gasoline'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <Cog className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transmission</span>
                  <span className="font-bold text-slate-800">{vehicle.transmission || 'Automatic'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Exterior Color</span>
                  <span className="font-bold text-slate-800">{vehicle.color || 'Standard'}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="space-y-3 pt-2">
              <Link
                to={isOutOfStock ? '#' : `/inventory/${vehicle.id}/purchase`}
                aria-disabled={isOutOfStock}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                    : 'bg-brand-500 hover:bg-brand-600 text-white hover:shadow-lg'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {isOutOfStock ? 'Sold Out / Out of Stock' : 'Proceed to Purchase'}
              </Link>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/vehicles/${vehicle.id}/edit`}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-white hover:bg-slate-50"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    Edit Details
                  </Link>

                  <Link
                    to={`/admin?restock_id=${vehicle.id}`}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-white hover:bg-slate-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Restock
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Specific Transaction History (if authenticated) */}
      {isAuthenticated && transactions.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Vehicle Ledger & Activity</h3>
              <p className="text-xs text-slate-500">Historical acquisitions, purchases, and restocks</p>
            </div>
            <History className="w-5 h-5 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                        tx.transaction_type === 'PURCHASE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-sm">{tx.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
