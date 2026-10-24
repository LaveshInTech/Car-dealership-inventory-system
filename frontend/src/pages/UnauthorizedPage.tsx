import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            You do not have administrative permissions to view this resource. This area is strictly restricted to Dealership Fleet Administrators.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/dashboard"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/inventory"
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Showroom
          </Link>
        </div>
      </div>
    </div>
  );
};
