import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  History,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  RefreshCw,
  Car,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { inventoryApi } from '../services/api';
import { InventoryTransaction } from '../types';

export const TransactionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const txTypeFilter = searchParams.get('type') || 'ALL';

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getTransactions({
        transaction_type: txTypeFilter !== 'ALL' ? txTypeFilter : undefined,
        limit: 100,
      });
      setTransactions(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load transaction audit log', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [txTypeFilter]);

  const setFilterType = (type: string) => {
    if (type === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ type });
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory Transaction Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete cryptographic audit trail of all purchases, restocks, and consignment events
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs transition-colors self-start sm:self-auto"
          title="Refresh transaction ledger"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5 pl-2">
          <Filter className="w-3.5 h-3.5" /> Filter by Type:
        </span>
        {['ALL', 'PURCHASE', 'RESTOCK'].map((t) => {
          const active = txTypeFilter === t;
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {t === 'ALL' ? 'All Transactions' : t === 'PURCHASE' ? 'Purchases' : 'Restocks'}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-slate-400 font-medium pr-2">
          {total} logged records
        </span>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 animate-pulse">
            Loading transaction audit records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No transactions found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-400 text-[10px]">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Unit Impact</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Notes / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => {
                  const isPurchase = tx.transaction_type === 'PURCHASE';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        TX-{tx.id.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                          isPurchase
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {isPurchase ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3 text-indigo-600" />
                          )}
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/inventory/${tx.vehicle_id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 transition-colors"
                        >
                          Vehicle #{tx.vehicle_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={tx.quantity_change > 0 ? 'text-indigo-600' : 'text-emerald-600'}>
                          {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change} Units
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                        {formatCurrency(tx.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={tx.notes || ''}>
                        {tx.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
