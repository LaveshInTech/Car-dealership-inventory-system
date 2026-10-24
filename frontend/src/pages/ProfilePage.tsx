import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  ShoppingBag,
  History,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { inventoryApi } from '../services/api';
import { InventoryTransaction } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [userTx, setUserTx] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTransactions = async () => {
      if (!user) return;
      try {
        const data = await inventoryApi.getTransactions({
          user_id: user.id,
          limit: 20,
        });
        setUserTx(data.items);
      } catch (e) {
        console.error('Failed to load user transactions', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTransactions();
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Profile & History
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your credentials, role privileges, and personal order records
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{user?.full_name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  {user?.role} Role
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Account Details Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">User ID</span>
            <span className="font-bold text-slate-900 font-mono text-sm">#{user?.id}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Account Created</span>
            <span className="font-bold text-slate-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Access Level</span>
            <span className="font-bold text-slate-900">
              {isAdmin ? 'Full Fleet Administrator' : 'Standard Customer Buyer'}
            </span>
          </div>
        </div>
      </div>

      {/* User's Order History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Personal Activity & Purchases</h3>
            <p className="text-xs text-slate-500">Orders placed under this account</p>
          </div>
          <History className="w-5 h-5 text-slate-400" />
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading activity log...
          </div>
        ) : userTx.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
            No purchases or transactions recorded under this account yet.{' '}
            <Link to="/inventory" className="text-brand-600 font-semibold hover:underline">
              Browse showroom vehicles
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {userTx.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-900">
                      TX-{tx.id.toString().padStart(6, '0')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                      tx.transaction_type === 'PURCHASE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {tx.transaction_type}
                    </span>
                  </div>
                  <p className="text-slate-600">{tx.notes}</p>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-slate-900 text-sm">
                    {formatCurrency(tx.total_amount)}
                  </div>
                  <span className="text-slate-500">
                    {Math.abs(tx.quantity_change)} unit(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
