'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  CameraOff, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Info
} from 'lucide-react';
import {
  PermissionState,
  PermissionError,
  requestCameraPermission,
  getCameraPermissionStatus,
  getCameraPermissionErrorMessage,
  getCameraPermissionRecoveryInstructions,
  getBrowserSpecificInstructions,
  getCameraAccessRequirements,
  isSecureContext,
  requiresHTTPSForCamera,
} from '@/lib/scanning/permission-utils';

export interface CameraPermissionProps {
  onPermissionGranted: () => void;
  onPermissionDenied: (error: PermissionError) => void;
  onPermissionRequested?: () => void;
  className?: string;
  showInstructions?: boolean;
  autoRequest?: boolean;
}

export function CameraPermission({
  onPermissionGranted,
  onPermissionDenied,
  onPermissionRequested,
  className = '',
  showInstructions = true,
  autoRequest = false,
}: CameraPermissionProps) {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PermissionError | null>(null);
  const [showRecoveryInstructions, setShowRecoveryInstructions] = useState(false);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const status = await getCameraPermissionStatus();
      setPermissionState(status);
      setError(null);

      if (status.granted) {
        onPermissionGranted();
      }
    } catch (err) {
      const permissionError = err as PermissionError;
      setError(permissionError);
      onPermissionDenied(permissionError);
    }
  }, [onPermissionGranted, onPermissionDenied]);

  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    onPermissionRequested?.();

    try {
      const status = await requestCameraPermission({
        showPrompt: true,
        retryAttempts: 2,
        retryDelay: 1000,
      });

      setPermissionState(status);

      if (status.granted) {
        onPermissionGranted();
      } else {
        const permissionError = new PermissionError(
          'Camera permission was not granted',
          'PERMISSION_DENIED',
          true
        );
        setError(permissionError);
        onPermissionDenied(permissionError);
      }
    } catch (err) {
      const permissionError = err as PermissionError;
      setError(permissionError);
      onPermissionDenied(permissionError);
    } finally {
      setIsLoading(false);
    }
  }, [onPermissionGranted, onPermissionDenied, onPermissionRequested]);

  // Check initial permission status
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Auto-request permission if enabled
  useEffect(() => {
    if (autoRequest && permissionState?.prompt) {
      handleRequestPermission();
    }
  }, [autoRequest, permissionState, handleRequestPermission]);

  const handleRetry = useCallback(() => {
    setError(null);
    setShowRecoveryInstructions(false);
    handleRequestPermission();
  }, [handleRequestPermission]);

  const handleShowInstructions = useCallback(() => {
    setShowRecoveryInstructions(!showRecoveryInstructions);
  }, [showRecoveryInstructions]);

  // Get environment requirements
  const requirements = getCameraAccessRequirements();
  const isSecure = isSecureContext();
  const needsHTTPS = requiresHTTPSForCamera();

  // Render permission status icon
  const renderStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />;
    }

    if (permissionState?.granted) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }

    if (permissionState?.denied || error) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }

    if (permissionState?.prompt) {
      return <Camera className="h-6 w-6 text-primary-500" />;
    }

    return <CameraOff className="h-6 w-6 text-gray-400" />;
  };

  // Render permission status message
  const renderStatusMessage = () => {
    if (isLoading) {
      return 'Requesting camera permission...';
    }

    if (permissionState?.granted) {
      return 'Camera access granted!';
    }

    if (permissionState?.denied) {
      return 'Camera access denied';
    }

    if (permissionState?.prompt) {
      return 'Camera permission required';
    }

    if (error) {
      return getCameraPermissionErrorMessage(error);
    }

    return 'Camera permission status unknown';
  };

  // Render action button
  const renderActionButton = () => {
    if (isLoading) {
      return (
        <Button disabled className="w-full">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Requesting Permission...
        </Button>
      );
    }

    if (permissionState?.granted) {
      return (
        <Button onClick={checkPermissionStatus} variant="outline" className="w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          Permission Granted
        </Button>
      );
    }

    if (permissionState?.denied || error?.code === 'PERMANENTLY_DENIED') {
      return (
        <div className="space-y-2">
          <Button onClick={handleShowInstructions} variant="outline" className="w-full">
            <Info className="h-4 w-4 mr-2" />
            Show Instructions
          </Button>
          {error?.recoverable && (
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return (
      <Button onClick={handleRequestPermission} className="w-full">
        <Camera className="h-4 w-4 mr-2" />
        Allow Camera Access
      </Button>
    );
  };

  // Render recovery instructions
  const renderRecoveryInstructions = () => {
    if (!showRecoveryInstructions || !error) {
      return null;
    }

    const instructions = getCameraPermissionRecoveryInstructions(error);
    const browserInstructions = getBrowserSpecificInstructions();

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">How to Enable Camera Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">General Instructions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Browser-Specific:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {browserInstructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render environment warnings
  const renderEnvironmentWarnings = () => {
    if (isSecure && !needsHTTPS) {
      return null;
    }

    return (
      <Alert className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {needsHTTPS ? (
            <div>
              <p className="font-medium">HTTPS Required</p>
              <p className="text-sm mt-1">
                Camera access requires a secure connection. Please use HTTPS or localhost.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">Security Warning</p>
              <p className="text-sm mt-1">
                This page is not secure. Camera access may be limited.
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {renderStatusIcon()}
          </div>
          <CardTitle className="text-lg">Camera Permission</CardTitle>
          <CardDescription>
            {renderStatusMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderActionButton()}
          
          {showInstructions && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Camera access is required for QR code scanning functionality.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {renderRecoveryInstructions()}
      {renderEnvironmentWarnings()}

      {/* Environment Requirements */}
      {requirements.recommendations.length > 0 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium">Environment Requirements</p>
              <ul className="text-sm mt-1 space-y-1">
                {requirements.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Simplified camera permission component for inline use
 */
export function InlineCameraPermission({
  onPermissionGranted,
  onPermissionDenied,
  className = '',
}: Pick<CameraPermissionProps, 'onPermissionGranted' | 'onPermissionDenied' | 'className'>) {
  return (
    <CameraPermission
      onPermissionGranted={onPermissionGranted}
      onPermissionDenied={onPermissionDenied}
      className={className}
      showInstructions={false}
      autoRequest={true}
    />
  );
}

/**
 * Camera permission status indicator
 */
export function CameraPermissionStatus({
  className = '',
}: {
  className?: string;
}) {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  useEffect(() => {
    getCameraPermissionStatus().then(setPermissionState);
  }, []);

  if (!permissionState) {
    return null;
  }

  const getStatusColor = () => {
    if (permissionState.granted) return 'text-green-500';
    if (permissionState.denied) return 'text-red-500';
    if (permissionState.prompt) return 'text-primary-500';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (permissionState.granted) return <CheckCircle className="h-4 w-4" />;
    if (permissionState.denied) return <XCircle className="h-4 w-4" />;
    if (permissionState.prompt) return <Camera className="h-4 w-4" />;
    return <CameraOff className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm ${getStatusColor()}`}>
        Camera: {String(permissionState.status)}
      </span>
    </div>
  );
}
