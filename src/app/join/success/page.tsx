'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import Link from 'next/link';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const error = searchParams.get('error');

  // Handle different error scenarios
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg overflow-hidden">
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 px-4 py-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Registration Failed</h2>
              <p className="text-red-700 text-sm">We encountered an issue with your registration</p>
            </div>

            {/* Error Message */}
            <div className="px-4 py-6 text-center">
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                {decodeURIComponent(error)}
              </p>
              
              <div className="space-y-3">
                <Link href="/join" className="block">
                  <div className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </div>
                </Link>
                
                <Link href="/" className="block">
                  <div className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" />
                    Return to Homepage
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing student ID
  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-primary-200 shadow-lg overflow-hidden">
            {/* Warning Header */}
            <div className="bg-gradient-to-r from-primary-50 to-white border-b border-primary-200 px-4 py-5 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Invalid Access</h2>
              <p className="text-primary-700 text-sm">No registration data found</p>
            </div>

            {/* Warning Message */}
            <div className="px-4 py-6 text-center">
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                It looks like you accessed this page directly. Please complete the registration process first.
              </p>
              
              <div className="space-y-3">
                <Link href="/join" className="block">
                  <div className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Start Registration
                  </div>
                </Link>
                
                <Link href="/" className="block">
                  <div className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" />
                    Return to Homepage
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success case - show QR code
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50 min-h-screen">
      <QRCodeDisplay studentId={studentId} />
      <div className=" flex flex-col sm:flex-row gap-3 justify-center mb-10">
        <Link
          href="/"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm text-center">Loading your registration status...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 