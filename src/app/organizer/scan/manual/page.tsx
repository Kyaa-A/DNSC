import { Metadata } from 'next';
import { Suspense } from 'react';
import { ManualEntryPage } from '@/components/scanning/ManualEntryPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, QrCode } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Manual Entry | DNSC Attendance Organizer',
  description: 'Manual student entry for attendance scanning when QR codes are not available',
};

export default function ManualEntryPageRoute() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manual Student Entry</h1>
          <p className="text-gray-600 mt-1">
            Manual student entry for attendance scanning when QR codes are not available
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>Organizer Portal</span>
        </div>
      </div>

      {/* Manual Entry Component */}
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading Manual Entry...</CardTitle>
            <CardDescription>Please wait while we load the manual entry interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <ManualEntryPage />
      </Suspense>
    </div>
  );
}
