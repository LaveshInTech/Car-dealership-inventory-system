import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Loader2,
  Receipt,
  Car,
} from 'lucide-react';
import { vehiclesApi, inventoryApi } from '../services/api';
import { Vehicle, InventoryTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const PurchaseConfirmPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [units, setUnits] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<InventoryTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const data = await vehiclesApi.getVehicleById(vehicleId);
        setVehicle(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Vehicle not found.');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    if (units <= 0) {
      toast.error('Purchase units must be at least 1.');
      return;
    }

    if (units > vehicle.quantity) {
      toast.error(`Only ${vehicle.quantity} unit(s) available in stock.`);
      return;
    }

    setSubmitting(true);
    try {
      const tx = await inventoryApi.purchaseVehicle(vehicle.id, {
        units,
        notes: notes.trim() || undefined,
      });
      setCompletedTx(tx);
      toast.success(`Purchase confirmed! Acquired ${units} unit(s).`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Purchase transaction failed.';
      toast.error(msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-pulse">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Preparing transaction order...</p>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">{error}</h3>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
      </div>
    );
  }

  if (!vehicle) return null;

  const isOutOfStock = vehicle.quantity <= 0;
  const subtotal = vehicle.price * units;
  const docFee = 495.0;
  const totalDue = subtotal + docFee;

  // Completed receipt view
  if (completedTx) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Order Confirmed & Stock Allocated
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Purchase Invoice #{completedTx.id}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Transaction ID: TX-{completedTx.id.toString().padStart(6, '0')}
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-brand-600" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h4>
                  <span className="text-xs text-slate-500">VIN: {vehicle.vin || 'N/A'}</span>
                </div>
              </div>
              <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                Qty: {Math.abs(completedTx.quantity_change)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Unit Price:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(completedTx.unit_price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal ({Math.abs(completedTx.quantity_change)} units):</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(completedTx.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Purchased By:</span>
                <span className="font-medium text-slate-900">{user?.full_name} ({user?.email})</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-baseline">
              <span className="text-xs font-bold uppercase text-slate-700">Total Transaction:</span>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(completedTx.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/transactions"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Receipt className="w-4 h-4" />
              View Transaction History
            </Link>
            <Link
              to="/inventory"
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 bg-white transition-colors"
            >
              Return to Showroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to={`/inventory/${vehicle.id}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Return to Details
      </Link>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-lg space-y-8">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
            Inventory Checkout & Allocation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Purchase Confirmation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify order volume, documentation details, and complete your vehicle acquisition
          </p>
        </div>

        {/* Vehicle Summary Card */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <img
            src={vehicle.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80'}
            alt={vehicle.model}
            className="w-full sm:w-36 h-24 object-cover rounded-xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {vehicle.category} • {vehicle.year || 2024}
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {vehicle.make} {vehicle.model}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              VIN: {vehicle.vin || 'WP0AA2A96PS298101'}
            </span>
            <div className="mt-2 text-xs font-semibold">
              <span className={isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}>
                {isOutOfStock ? 'Currently Out of Stock' : `${vehicle.quantity} Units Available`}
              </span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Unit Price</span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(vehicle.price)}</span>
          </div>
        </div>

        {isOutOfStock ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="text-base font-bold text-rose-900">Vehicle is Out of Stock</h4>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              This model currently has zero available units in showroom inventory. Purchases cannot be processed until inventory is restocked by dealership administration.
            </p>
            <Link
              to="/inventory"
              className="inline-block mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Browse Other Models
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePurchase} className="space-y-6">
            {/* Unit Quantity Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Units to Purchase *
                </label>
                <input
                  type="number"
                  min="1"
                  max={vehicle.quantity}
                  value={units}
                  onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Maximum available: {vehicle.quantity} unit(s)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Buyer Account
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                  {user?.full_name} ({user?.email})
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Purchase Order Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Immediate lot pickup / customer requested enclosed transport"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>

            {/* Pricing Breakdown Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Order Financial Breakdown
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    Vehicle Unit Price ({units} × {formatCurrency(vehicle.price)}):
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dealer Conveyance & Documentation Fee:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(docFee)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Purchase Amount:</span>
                <span className="text-2xl font-extrabold text-brand-600">
                  {formatCurrency(totalDue)}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                to={`/inventory/${vehicle.id}`}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || units > vehicle.quantity || units <= 0}
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing Transaction...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Confirm & Complete Purchase
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
