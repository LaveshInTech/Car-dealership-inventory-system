import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { vehiclesApi } from '../services/api';
import { useToast } from '../components/Toast';

const editVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(64),
  model: z.string().min(1, 'Model is required').max(64),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be greater than zero'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  year: z.coerce.number().int().min(1900).max(2030).optional().nullable(),
  vin: z.string().max(32).optional().nullable(),
  color: z.string().max(32).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  fuel_type: z.string().max(32).optional().nullable(),
  transmission: z.string().max(32).optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type EditVehicleFormData = z.infer<typeof editVehicleSchema>;

export const EditVehiclePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditVehicleFormData>({
    resolver: zodResolver(editVehicleSchema) as any,
  });

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const data = await vehiclesApi.getVehicleById(vehicleId);
        reset({
          make: data.make,
          model: data.model,
          category: data.category,
          price: data.price,
          quantity: data.quantity,
          year: data.year,
          vin: data.vin || '',
          color: data.color || '',
          mileage: data.mileage || 0,
          fuel_type: data.fuel_type || 'Gasoline',
          transmission: data.transmission || 'Automatic',
          description: data.description || '',
          image_url: data.image_url || '',
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load vehicle data.');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId, reset]);

  const onSubmit = async (data: EditVehicleFormData) => {
    setSubmitting(true);
    try {
      await vehiclesApi.updateVehicle(vehicleId, {
        ...data,
        year: data.year ? Number(data.year) : undefined,
        mileage: data.mileage ? Number(data.mileage) : 0,
        vin: data.vin || undefined,
        color: data.color || undefined,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
      });
      toast.success('Vehicle details updated successfully!');
      navigate(`/inventory/${vehicleId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading vehicle details...</p>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to={`/inventory/${vehicleId}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Return to Details
      </Link>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Vehicle Listing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Update pricing, specifications, and inventory counts
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Make *
              </label>
              <input
                type="text"
                {...register('make')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.make && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.make.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Model *
              </label>
              <input
                type="text"
                {...register('model')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.model && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.model.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:border-brand-500"
              >
                <option value="Coupe">Coupe</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Wagon">Wagon</option>
                <option value="Convertible">Convertible</option>
                <option value="Electric">Electric</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                {...register('quantity')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Model Year
              </label>
              <input
                type="number"
                {...register('year')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Mileage (mi)
              </label>
              <input
                type="number"
                {...register('mileage')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Color
              </label>
              <input
                type="text"
                {...register('color')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Fuel Type
              </label>
              <select
                {...register('fuel_type')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:border-brand-500"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Transmission
              </label>
              <select
                {...register('transmission')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:border-brand-500"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                VIN
              </label>
              <input
                type="text"
                {...register('vin')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                {...register('image_url')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to={`/inventory/${vehicleId}`}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
