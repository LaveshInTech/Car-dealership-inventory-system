import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  DollarSign,
  AlertTriangle,
  PackageX,
  TrendingUp,
  Boxes,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi } from '../services/api';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardApi.getSummary();
      setData(summary);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const COLORS = ['#3882b2', '#0f172a', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-lg mx-auto shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-sm text-slate-500 mb-6">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={fetchDashboard}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory Intelligence & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time dealership portfolio valuation, inventory velocity, and audit trail
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Valuation"
          value={formatCurrency(data.total_valuation)}
          subtitle="Sum of active inventory units × unit prices"
          icon={DollarSign}
          badge={{ text: 'Portfolio Value', variant: 'info' }}
        />
        <StatCard
          title="Stock Units"
          value={data.total_units}
          subtitle={`Across ${data.total_models} vehicle models`}
          icon={Boxes}
          badge={{ text: `${data.total_models} Models`, variant: 'success' }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={data.low_stock_count}
          subtitle="Vehicles with 3 or fewer units remaining"
          icon={AlertTriangle}
          badge={{
            text: data.low_stock_count > 0 ? 'Action Needed' : 'Healthy',
            variant: data.low_stock_count > 0 ? 'warning' : 'success',
          }}
        />
        <StatCard
          title="Out of Stock"
          value={data.out_of_stock_count}
          subtitle="Models with 0 available units"
          icon={PackageX}
          badge={{
            text: data.out_of_stock_count > 0 ? 'Depleted' : 'All Stocked',
            variant: data.out_of_stock_count > 0 ? 'danger' : 'success',
          }}
        />
      </div>

      {/* Sales Performance Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sales Revenue (Real Purchases)
            </span>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.total_sales_revenue)}
            </div>
            <p className="text-xs text-slate-400">
              Total {data.total_units_sold} vehicle units sold to date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/inventory"
            className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
          >
            Explore Inventory
          </Link>
          <Link
            to="/transactions"
            className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            View Audit Log
          </Link>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Valuation Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inventory Valuation by Category</h3>
              <p className="text-xs text-slate-500">Capital distribution across vehicle segments</p>
            </div>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Valuation']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="valuation" fill="#3882b2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Units Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Units in Stock by Category</h3>
              <p className="text-xs text-slate-500">Volume share of vehicles currently on lot</p>
            </div>
            <Car className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categories}
                  dataKey="units_in_stock"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {data.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Units`, 'Quantity']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {data.categories.map((c, idx) => (
              <div key={c.category} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span>{c.category} ({c.units_in_stock})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Vehicles & Recent Transactions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Vehicles */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recently Added Vehicles</h3>
                <p className="text-xs text-slate-500">Latest additions to the showroom inventory</p>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data.recent_vehicles.slice(0, 5).map((vehicle) => (
                <div key={vehicle.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={vehicle.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80'}
                      alt={vehicle.model}
                      className="w-12 h-9 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/inventory/${vehicle.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors truncate block"
                      >
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Link>
                      <span className="text-xs text-slate-500">{vehicle.category}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(vehicle.price)}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      vehicle.quantity === 0
                        ? 'bg-rose-100 text-rose-700'
                        : vehicle.quantity <= 2
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {vehicle.quantity === 0 ? 'Out of stock' : `${vehicle.quantity} in stock`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions Activity Log */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Inventory Activity</h3>
                <p className="text-xs text-slate-500">Audit trail of purchases and restocks</p>
              </div>
              <Link
                to="/transactions"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Full audit <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wide uppercase ${
                        tx.transaction_type === 'PURCHASE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {tx.transaction_type}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium truncate max-w-xs">{tx.notes}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 text-sm">
                      {formatCurrency(tx.total_amount)}
                    </div>
                    <span className="text-slate-500">
                      {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change} unit(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
