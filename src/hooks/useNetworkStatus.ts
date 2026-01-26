import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Initial status
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if supported
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}
