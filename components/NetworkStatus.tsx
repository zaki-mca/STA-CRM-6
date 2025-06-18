"use client";

import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  className?: string;
  pollingInterval?: number; // in milliseconds
  apiEndpoint?: string;
}

export function NetworkStatus({
  className,
  pollingInterval = 30000, // Default: check every 30 seconds
  apiEndpoint = '/api/health',
}: NetworkStatusProps) {
  const [status, setStatus] = useState<'online' | 'offline' | 'degraded' | 'checking'>('checking');
  const [environment, setEnvironment] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkConnection = async () => {
      if (!isMounted) return;
      
      try {
        const response = await fetch(apiEndpoint, { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status === 'healthy' ? 'online' : 'degraded');
          setEnvironment(data.environment || process.env.NEXT_PUBLIC_SITE_ENV || null);
        } else {
          setStatus('degraded');
        }
      } catch (error) {
        if (!isMounted) return;
        setStatus('offline');
      }
      
      setLastChecked(new Date());
      
      // Schedule next check
      timeoutId = setTimeout(checkConnection, pollingInterval);
    };
    
    // Initial check
    checkConnection();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [apiEndpoint, pollingInterval]);
  
  // Display the appropriate badge based on status
  const renderStatusBadge = () => {
    switch (status) {
      case 'online':
        return (
          <Badge variant="outline" className={cn("bg-green-50 text-green-700 border-green-200 flex items-center gap-1", className)}>
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs font-medium">API Online{environment ? ` (${environment})` : ''}</span>
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200 flex items-center gap-1", className)}>
            <WifiOff className="h-3 w-3" />
            <span className="text-xs font-medium">API Offline</span>
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="outline" className={cn("bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1", className)}>
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">API Degraded{environment ? ` (${environment})` : ''}</span>
          </Badge>
        );
      case 'checking':
      default:
        return (
          <Badge variant="outline" className={cn("bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1", className)}>
            <span className="animate-pulse h-2 w-2 bg-blue-500 rounded-full mr-1" />
            <span className="text-xs font-medium">Checking API...</span>
          </Badge>
        );
    }
  };
  
  return (
    <div className={cn("inline-flex items-center", className)}>
      {renderStatusBadge()}
    </div>
  );
} 