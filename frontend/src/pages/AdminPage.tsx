import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  PackagePlus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Loader2,
  X,
  Edit3,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { vehiclesApi, inventoryApi } from '../services/api';
import { Vehicle } from '../types';
import { useToast } from '../components/Toast';

export const AdminPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Restock modal state
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [restockUnits, setRestockUnits] = useState(5);
  const [restockNotes, setRestockNotes] = useState('');
  const [restocking, setRestocking] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehiclesApi.getVehicles({ page_size: 100 });
      setVehicles(data.items);

      // Check if URL parameter requested restock of specific vehicle
      const restockId = searchParams.get('restock_id');
      if (restockId) {
        const found = data.items.find((v) => v.id === parseInt(restockId, 10));
        if (found) {
          openRestockModal(found);
        }
      }
    } catch (err) {
      console.error('Failed to load vehicles for admin panel', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openRestockModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setRestockUnits(5);
    setRestockNotes(`Warehouse shipment arrival for ${v.make} ${v.model}`);
    setRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    if (restockUnits <= 0) {
      toast.error('Restock units must be greater than zero.');
      return;
    }

    setRestocking(true);
    try {
      await inventoryApi.restockVehicle(selectedVehicle.id, {
        units: restockUnits,
        notes: restockNotes.trim() || undefined,
      });
      toast.success(
        `Successfully restocked +${restockUnits} units of ${selectedVehicle.make} ${selectedVehicle.model}.`
      );
      setRestockModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to restock vehicle.');
    } finally {
      setRestocking(false);
    }
  };

  const openDeleteModal = (v: Vehicle) => {
    setVehicleToDelete(v);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!vehicleToDelete) return;
    setDeleting(true);
    try {
      await vehiclesApi.deleteVehicle(vehicleToDelete.id);
      toast.success(`Vehicle ${vehicleToDelete.make} ${vehicleToDelete.model} deleted.`);
      setDeleteModalOpen(false);
      setVehicleToDelete(null);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete vehicle.');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              Admin Restricted
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Dealership Fleet Operations & Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Restock inventory consignments, curate catalog listings, and manage showroom stock levels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicles}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/vehicles/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Vehicle
          </Link>
        </div>
      </div>

      {/* Admin Vehicles Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 animate-pulse">
            Loading fleet inventory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-400 text-[10px]">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vehicles.map((v) => {
                  const isOutOfStock = v.quantity === 0;
                  const isLowStock = v.quantity > 0 && v.quantity <= 2;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=150&q=80'}
                            alt={v.model}
                            className="w-12 h-9 rounded-lg object-cover"
                          />
                          <div>
                            <Link
                              to={`/inventory/${v.id}`}
                              className="font-bold text-slate-900 hover:text-brand-600 transition-colors block text-sm"
                            >
                              {v.year} {v.make} {v.model}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              VIN: {v.vin || 'N/A'} • ID: #{v.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{v.category}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(v.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOutOfStock ? '0 (Out of Stock)' : `${v.quantity} Units`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRestockModal(v)}
                            className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="Restock Units"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            Restock
                          </button>
                          <Link
                            to={`/vehicles/${v.id}/edit`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(v)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete vehicle record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Restock Vehicle</h3>
              </div>
              <button
                onClick={() => setRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-900 block">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </span>
              <p className="text-slate-500">
                Current Lot Stock: <span className="font-semibold text-slate-800">{selectedVehicle.quantity} units</span>
              </p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Units to Restock (Add) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={restockUnits}
                  onChange={(e) => setRestockUnits(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Restock Ledger Notes
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Factory delivery receipt #4829"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  {restocking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Restocking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Restock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Delete Vehicle Listing?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-slate-800">
                  {vehicleToDelete.make} {vehicleToDelete.model} (#{vehicleToDelete.id})
                </span>
                ? This action removes the record from the catalog.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Vehicle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
