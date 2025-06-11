"use client";

import React from 'react';
import { useCRM } from '@/contexts/crm-context';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const { networkStatus, refreshData } = useCRM();
  const isOnline = networkStatus === 'online';

  return (
    <div className={`flex items-center ${className}`}>
      {isOnline ? (
        <div className="flex items-center text-green-600 text-xs">
          <Wifi className="h-3 w-3 mr-1" />
          <span>Online</span>
        </div>
      ) : (
        <div className="flex items-center text-red-600 text-xs cursor-pointer" onClick={refreshData}>
          <WifiOff className="h-3 w-3 mr-1" />
          <span>Offline (click to retry)</span>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus; 