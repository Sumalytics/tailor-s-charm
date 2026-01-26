import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBanner } from '@/contexts/BannerContext';

interface OfflineBannerProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
  className?: string;
}

export function OfflineBanner({ 
  onRetry, 
  showRetryButton = true,
  className = '' 
}: OfflineBannerProps) {
  const { isOnline, isOffline, effectiveType } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const { setBannerHeight } = useBanner();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show banner when offline, hide when online
    if (isOffline) {
      setShowBanner(true);
    } else {
      // Keep banner visible for a moment when coming back online
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  useEffect(() => {
    // Update banner height when visibility changes
    if (bannerRef.current) {
      const height = showBanner ? bannerRef.current.offsetHeight : 0;
      setBannerHeight(height);
    }
  }, [showBanner, setBannerHeight]);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div 
      ref={bannerRef}
      className={`
        fixed top-0 left-0 right-0 z-50 
        ${isOffline ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}
        ${className}
      `}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {isOffline ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium text-sm">
                {isOffline ? 'No Internet Connection' : 'Connection Restored'}
              </span>
              {effectiveType && (
                <Badge variant="secondary" className="text-xs">
                  {effectiveType}
                </Badge>
              )}
            </div>
          </div>
          
          {showRetryButton && isOffline && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FullPageOffline({ onRetry }: { onRetry?: () => void }) {
  const { isOnline, isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="h-8 w-8 text-orange-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Internet Connection
          </h1>
          
          <p className="text-gray-600 mb-6">
            You're currently offline. Some features may not be available until you reconnect to the internet.
          </p>
          
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-2">What's available offline:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• View previously loaded data</li>
                <li>• Navigate between pages</li>
                <li>• Use cached information</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-orange-900 mb-2">What requires internet:</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Creating new records</li>
                <li>• Saving changes</li>
                <li>• Loading fresh data</li>
                <li>• User authentication</li>
              </ul>
            </div>
          </div>
          
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full mt-6"
              disabled={!isOnline}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isOnline ? 'Retry Connection' : 'Waiting for Connection...'}
            </Button>
          )}
          
          <p className="text-xs text-gray-500 mt-4">
            Your connection status will be automatically detected.
          </p>
        </div>
      </div>
    </div>
  );
}

export function NetworkStatusIndicator() {
  const { isOnline, isOffline, effectiveType } = useNetworkStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOffline && (
        <div className="bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      )}
    </div>
  );
}
