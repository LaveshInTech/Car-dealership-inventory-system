import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Edit3,
  SlidersHorizontal,
  X,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { vehiclesApi } from '../services/api';
import { Vehicle } from '../types';
import { VehicleCard } from '../components/VehicleCard';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // View mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Query state derived from searchParams
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local state for filter inputs
  const [searchTerm, setSearchTerm] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = ['All', 'Coupe', 'Sedan', 'SUV', 'Truck', 'Wagon', 'Electric', 'Luxury'];

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehiclesApi.getVehicles({
        search: search || undefined,
        category: category && category !== 'All' ? category : undefined,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 12,
      });
      setVehicles(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchParams]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const current: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      current[key] = value;
    });
    const merged: Record<string, string> = { ...current, page: '1' };
    Object.entries(newParams).forEach(([key, val]) => {
      if (val && val !== 'All') {
        merged[key] = val;
      } else {
        delete merged[key];
      }
    });
    setSearchParams(merged);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleApplyPriceFilter = () => {
    updateFilters({ min_price: minPriceInput, max_price: maxPriceInput });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vehicle Showroom & Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, and manage available high-performance and luxury inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid vs Table View Toggle */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {isAdmin && (
            <Link
              to="/vehicles/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Vehicle
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by make, model, color, or keyword..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                updateFilters({ sort_by: sb, sort_order: so as 'asc' | 'desc' });
              }}
              className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:border-brand-500"
            >
              <option value="created_at-desc">Newest Additions</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="quantity-asc">Stock: Low to High</option>
              <option value="quantity-desc">Stock: High to Low</option>
              <option value="year-desc">Year: Newest</option>
            </select>

            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="md:hidden p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills & Price Filter Section */}
        <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-3 border-t border-slate-100 ${mobileFiltersOpen ? 'block' : 'hidden md:flex'}`}>
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => {
              const active = (!category && cat === 'All') || category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    updateFilters({ category: cat === 'All' ? null : cat });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Min & Max Price Inputs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Price:</span>
            <input
              type="number"
              placeholder="Min $"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
            <span className="text-slate-300">-</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
            <button
              onClick={handleApplyPriceFilter}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Filter
            </button>
            {(search || category || minPrice || maxPrice) && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Content Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-96 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Matching Vehicles Found</h3>
          <p className="text-sm text-slate-500 mb-6">
            Try adjusting your search criteria, clearing price filters, or selecting a different category.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Mileage</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                              className="font-bold text-slate-900 hover:text-brand-600 transition-colors block"
                            >
                              {v.year} {v.make} {v.model}
                            </Link>
                            <span className="text-xs text-slate-400 font-mono">
                              VIN: {v.vin || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{v.category}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {v.mileage ? `${v.mileage.toLocaleString()} mi` : '0 mi'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
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
                          {isOutOfStock ? 'Out of Stock' : `${v.quantity} Units`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/inventory/${v.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={isOutOfStock ? '#' : `/inventory/${v.id}/purchase`}
                            aria-disabled={isOutOfStock}
                            className={`p-1.5 rounded-lg text-white ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                                : 'bg-brand-500 hover:bg-brand-600'
                            }`}
                            title={isOutOfStock ? 'Out of Stock' : 'Purchase'}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <Link
                              to={`/vehicles/${v.id}/edit`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="Edit specifications"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">
            Showing Page <span className="font-bold text-slate-900">{page}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span> ({total} vehicles total)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => updateFilters({ page: (page - 1).toString() })}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: (page + 1).toString() })}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
