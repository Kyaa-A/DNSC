'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { Download, CheckCircle, Camera, User, AlertCircle, RotateCcw, Zap } from 'lucide-react';

interface QRCodeDisplayProps {
  studentId: string;
}

interface StudentData {
  firstName: string;
  lastName: string;
  studentIdNumber: string;
}

export function QRCodeDisplay({ studentId }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch QR code from public endpoint (no authentication required)
      const qrResponse = await fetch(`/api/public/students/${studentId}/qr`);
      if (!qrResponse.ok) {
        if (qrResponse.status === 404) {
          throw new Error('Student record not found. Please verify your registration.');
        } else if (qrResponse.status >= 500) {
          throw new Error('Server error. Please try again in a moment.');
        } else {
          throw new Error('Failed to generate QR code. Please try again.');
        }
      }
      const blob = await qrResponse.blob();
      setQrCodeUrl(URL.createObjectURL(blob));

      // Fetch student data from public endpoint (no authentication required)
      const studentResponse = await fetch(`/api/public/students/${studentId}`);
      if (studentResponse.ok) {
        const student = await studentResponse.json();
        setStudentData({
          firstName: student.firstName,
          lastName: student.lastName,
          studentIdNumber: student.studentIdNumber
        });
      } else {
        // QR code worked but student data failed - not critical
        console.warn('Could not fetch student details, but QR code is available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) return;
    fetchData();

    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
    // The qrCodeUrl is intentionally omitted from the dependency array to prevent an infinite loop.
    // The cleanup function correctly uses the value from the previous render to revoke the old URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `dnsc-qr-code-${studentData?.studentIdNumber || studentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="relative py-8 px-4">
        <div className="">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            {/* Header Section Skeleton */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 animate-pulse text-sm font-medium mb-4 w-40 h-8">
              </div>

              <div className="space-y-3 mb-3">
                <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-1/2"></div>
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
              </div>
            </div>

            {/* QR Code Display Card Skeleton */}
            <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-lg">
              <div className="absolute -right-10 -top-10 size-24 rounded-full bg-primary-400/10 blur-xl" />

              <div className="relative p-6 sm:p-8 space-y-6 bg-white">
                {/* Student Information Skeleton */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>

                  <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-24"></div>
                </div>

                {/* QR Code Animation */}
                <div className="text-center space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm inline-block">
                    <div className="w-[280px] sm:w-[320px] h-[280px] sm:h-[320px] relative bg-gray-50 rounded-lg overflow-hidden">
                      {/* Subtle QR Grid Animation */}
                      <div className="grid grid-cols-12 gap-1 w-full h-full p-4">
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-gray-200 rounded-sm animate-pulse"
                            style={{
                              animationDelay: `${i * 20}ms`,
                              animationDuration: '2s',
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Subtle scanning effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-400/20 to-transparent w-8"
                        style={{ 
                          animation: 'scan-horizontal 3s ease-in-out infinite'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Instructions Skeleton */}
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded mt-0.5 flex-shrink-0"></div>
                      <div className="text-left space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button Skeleton */}
                  <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>

                  {/* Trust Indicators Skeleton */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Accent Line */}
              <div className="h-1 bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes scan-horizontal {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(320px); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50 min-h-screen py-8 px-4">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-lg">
            <div className="absolute -right-10 -top-10 size-24 rounded-full bg-red-400/10 blur-xl" />

            {/* Error Header */}
            <div className="relative bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 p-6 sm:p-8 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">QR Code Error</h2>
              <p className="text-red-700 text-sm">Unable to generate your QR code</p>
            </div>

            {/* Error Message & Actions */}
            <div className="relative p-6 sm:p-8 text-center">
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                {error}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={retryCount >= 3}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
                </Button>

                {retryCount >= 3 && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    If the problem persists, please contact support or try registering again.
                  </p>
                )}
              </div>
            </div>

            <div className="h-1 w-0 bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 group-hover:w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative  py-8 px-4">
      <div className="">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 border border-primary-200 text-primary-800 text-sm font-medium mb-4">
              <CheckCircle className="size-4" />
              <span>Registration Complete</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              <span className="text-gray-900">Welcome to </span>
              <span className="text-primary-600">DNSC Events!</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
              Your QR code is ready for future use. Save it to your device for quick event check-ins.
            </p>
          </div>

          {/* QR Code Display Card */}
          <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute -right-10 -top-10 size-24 rounded-full bg-primary-400/10 blur-xl group-hover:bg-primary-400/15 transition-colors" />

            <div className="relative p-6 sm:p-8 space-y-6 bg-white">
              {/* Student Information */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <User className="size-5 text-primary-600" />
                  <span className="font-semibold text-gray-900">Student Information</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {studentData ? `${studentData.firstName} ${studentData.lastName}` : 'Student'}
                </h2>
                <p className="text-gray-600 font-medium">
                  ID: {studentData?.studentIdNumber || studentId}
                </p>
              </div>

              {/* QR Code Display */}
              <div className="text-center space-y-4">
                {qrCodeUrl && (
                  <div>
                    <div className="bg-white rounded-lg p-4 shadow-sm inline-block">
                      <Image
                        src={qrCodeUrl}
                        alt="Your DNSC Event QR Code"
                        width={320}
                        height={380}
                        className="w-full max-w-[280px] sm:max-w-[320px] h-auto rounded-lg"
                        priority
                      />
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-primary-800 text-sm font-semibold mb-1">Save this QR code:</p>
                      <p className="text-primary-700 text-sm leading-relaxed">
                        Screenshot or download this image to use for event check-ins.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  disabled={!qrCodeUrl}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group/btn"
                >
                  <Download className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                  Download QR Code
                </Button>

                {/* Trust Indicators */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-3 text-green-500" />
                      <span>Ready for Events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="size-3 text-primary-500" />
                      <span>Instant Check-in</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="h-1 w-0 bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500 group-hover:w-full" />
          </div>
        </div>
      </div>

      

    </div>
  );
}