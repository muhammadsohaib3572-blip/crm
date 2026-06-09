'use client';

import Link from 'next/link';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-4xl font-black text-gray-900 mb-2">403</h1>
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            You Are Not Authorized To Access This Page
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Your current role does not have permission to view this section.
            Please contact your administrator if you believe this is an error.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
