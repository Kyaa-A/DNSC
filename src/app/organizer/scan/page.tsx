import { Metadata } from 'next';
import { Suspense } from 'react';
import { ScanPage } from '@/components/organizer/ScanPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export const metadata: Metadata = {
  title: 'QR Scanner | DNSC Attendance Organizer',
  description: 'Scan student QR codes to record attendance for your sessions',
};

export default function ScanPageRoute() {
  return (
    <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">QR Scanner</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Scan student QR codes to record attendance for your sessions
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">Organizer Portal</span>
          <span className="sm:hidden">Portal</span>
        </div>
      </div>

      {/* Scanner Component */}
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading Scanner...</CardTitle>
            <CardDescription>Initializing camera interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <ScanPage />
      </Suspense>
    </div>
  );
}
