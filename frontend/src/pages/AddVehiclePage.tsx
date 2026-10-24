import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { vehiclesApi } from '../services/api';
import { useToast } from '../components/Toast';

const vehicleSchema = z.object({
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

type VehicleFormData = z.infer<typeof vehicleSchema>;

export const AddVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      quantity: 1,
      year: 2024,
      mileage: 0,
      fuel_type: 'Gasoline',
      transmission: 'Automatic',
      category: 'Coupe',
    },
  });

  const imageUrlValue = watch('image_url');

  const onSubmit = async (data: VehicleFormData) => {
    setSubmitting(true);
    try {
      const created = await vehiclesApi.createVehicle({
        ...data,
        year: data.year ? Number(data.year) : undefined,
        mileage: data.mileage ? Number(data.mileage) : 0,
        vin: data.vin || undefined,
        color: data.color || undefined,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
      });
      toast.success(`Vehicle ${created.make} ${created.model} added successfully!`);
      navigate(`/inventory/${created.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Back to Inventory
      </Link>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Add New Vehicle
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register a new vehicle into the active showroom inventory
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Make *
              </label>
              <input
                type="text"
                {...register('make')}
                placeholder="e.g. Porsche"
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
                placeholder="e.g. 911 GT3 RS"
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
              {errors.category && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price')}
                placeholder="150000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Initial Stock Quantity *
              </label>
              <input
                type="number"
                {...register('quantity')}
                placeholder="1"
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
                placeholder="2024"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.year && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Additional Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Mileage (mi)
              </label>
              <input
                type="number"
                {...register('mileage')}
                placeholder="0"
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
                placeholder="Chalk Gray"
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

          {/* VIN & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                VIN (Vehicle Identification Number)
              </label>
              <input
                type="text"
                {...register('vin')}
                placeholder="WP0AA2A96PS298101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Image URL (High-Resolution Photo)
              </label>
              <input
                type="url"
                {...register('image_url')}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              {errors.image_url && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.image_url.message}</p>
              )}
            </div>
          </div>

          {/* Image Preview if provided */}
          {imageUrlValue && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
              <img
                src={imageUrlValue}
                alt="Preview"
                className="w-24 h-16 rounded-xl object-cover bg-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80';
                }}
              />
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-800 block">Image Preview</span>
                Ensure photo is high resolution with clear automotive framing.
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description & Options
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Highlight factory options, packages, horsepower rating, and condition..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/inventory"
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
                  Saving Vehicle...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create Vehicle Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
