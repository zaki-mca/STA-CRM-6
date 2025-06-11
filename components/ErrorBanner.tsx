"use client";

import React from 'react';
import { useCRM } from '@/contexts/crm-context';
import { AlertTriangle, X, RefreshCw, Database, Wifi } from 'lucide-react';

interface ErrorBannerProps {
  className?: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ className = '' }) => {
  const { error, errorDetails, clearError, refreshData } = useCRM();

  if (!error) return null;

  const isServerError = errorDetails?.status && errorDetails.status >= 500;
  const isDatabaseError = error.toLowerCase().includes('database') || 
                         error.toLowerCase().includes('sql') || 
                         error.toLowerCase().includes('query') ||
                         error.toLowerCase().includes('duplicate entry');
  const isNetworkError = error.toLowerCase().includes('network') || 
                        error.toLowerCase().includes('fetch') ||
                        error.toLowerCase().includes('connection');
  const errorTime = errorDetails?.timestamp ? new Date(errorDetails.timestamp).toLocaleTimeString() : '';

  // Provide helpful suggestions based on error type
  const getErrorHelp = () => {
    if (isDatabaseError) {
      return "The database server might be down or overloaded. Please try again later or contact support.";
    } else if (isNetworkError) {
      return "Check your internet connection and try again. The server might be unavailable.";
    } else if (isServerError) {
      return "The server encountered an internal error. Our team has been notified.";
    }
    return "Please try refreshing the page or try again later.";
  };

  // Select appropriate icon based on error type
  const ErrorIcon = isDatabaseError ? Database : isNetworkError ? Wifi : AlertTriangle;

  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ErrorIcon className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-800">
              {isServerError ? `${errorDetails?.status} Error` : 'Error'} {errorTime && `at ${errorTime}`}
            </h3>
            <button
              type="button"
              className="ml-auto bg-red-50 text-red-500 rounded-md inline-flex hover:bg-red-100"
              onClick={() => clearError()}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            {errorDetails?.message && errorDetails.message !== error && (
              <p className="mt-1">{errorDetails.message}</p>
            )}
            <p className="mt-2 text-sm text-red-600 italic">
              {getErrorHelp()}
            </p>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center"
              onClick={() => {
                clearError();
                refreshData();
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBanner; 