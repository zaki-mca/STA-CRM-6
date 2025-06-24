"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

interface NetworkStatusProps {
  pollingInterval?: number; // milliseconds
}

export function NetworkStatus({ pollingInterval = 30000 }: NetworkStatusProps) {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkServerStatus = async () => {
    try {
      setStatus('checking');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health`.replace('/api/health', '/health'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Server returned an error status';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, use the raw text
          if (errorText) errorMessage = errorText;
        }
        
        setStatus('offline');
        setErrorDetails(errorMessage);
        return false;
      }

      const data = await response.json();
      
      if (data.db && !data.db.healthy) {
        setStatus('offline');
        setErrorDetails(`Database connection issue: ${data.db.details || 'Unknown error'}`);
        return false;
      }
      
      setStatus('online');
      setErrorDetails(null);
      setRetryCount(0);
      return true;
    } catch (error) {
      setStatus('offline');
      setErrorDetails('Cannot connect to API server');
      return false;
    } finally {
      setLastChecked(new Date());
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    await checkServerStatus();
    setIsRetrying(false);
  };

  useEffect(() => {
    // Initial check
    checkServerStatus();

    // Set up polling
    const interval = setInterval(() => {
      checkServerStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  // Auto-retry logic when offline
  useEffect(() => {
    if (status === 'offline' && !isRetrying) {
      const retryDelay = Math.min(10000, 2000 * Math.pow(2, retryCount)); // Exponential backoff with max 10s
      
      const timer = setTimeout(() => {
        handleRetry();
      }, retryDelay);
      
      return () => clearTimeout(timer);
    }
  }, [status, isRetrying, retryCount]);

  if (status === 'online') {
    return null; // Don't show anything when online
  }

  return (
    <Alert variant={status === 'checking' ? 'default' : 'destructive'} className="fixed bottom-4 right-4 max-w-md z-50">
      <div className="flex items-center gap-2">
        {status === 'checking' ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertDescription className="flex-1">
          {status === 'checking' ? (
            'Checking server connection...'
          ) : (
            <>
              <p className="font-medium">Connection issue detected</p>
              <p className="text-sm">{errorDetails || 'Cannot connect to the server'}</p>
              {lastChecked && <p className="text-xs mt-1">Last checked: {lastChecked.toLocaleTimeString()}</p>}
            </>
          )}
        </AlertDescription>
        {status === 'offline' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-2" 
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Retry'}
          </Button>
        )}
      </div>
    </Alert>
  );
}

export default NetworkStatus; 