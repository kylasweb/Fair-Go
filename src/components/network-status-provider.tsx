'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useUIStore } from '@/lib/store';
import { useWebSocket } from '@/lib/websocket';
import { useNetworkStatus, useSyncPendingActions } from '@/lib/queries';

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const { networkStatus, pendingSyncActions } = useUIStore();
  const { isConnected } = useWebSocket();
  const syncMutation = useSyncPendingActions();
  
  // Use the network status hook to monitor online/offline
  useNetworkStatus();

  // Handle sync when coming back online
  const handleOnlineSync = useCallback(() => {
    if (pendingSyncActions.length > 0) {
      toast.info(`Syncing ${pendingSyncActions.length} offline actions...`);
      syncMutation.mutate();
    }
  }, [pendingSyncActions.length, syncMutation]);

  useEffect(() => {
    const handleOnline = () => {
      toast.success('Connection restored!');
      handleOnlineSync();
    };

    const handleOffline = () => {
      toast.warning('You are now offline. Your actions will be saved and synced when you reconnect.');
    };

    // Listen for network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnlineSync]);

  // Show persistent offline indicator
  useEffect(() => {
    if (networkStatus === 'offline') {
      // Add a visual indicator to the body or a global state
      document.body.classList.add('offline-mode');
    } else {
      document.body.classList.remove('offline-mode');
    }

    return () => {
      document.body.classList.remove('offline-mode');
    };
  }, [networkStatus]);

  return (
    <>
      {children}
      
      {/* Offline status indicator */}
      {networkStatus === 'offline' && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Offline Mode
              {pendingSyncActions.length > 0 && (
                <span className="ml-2 text-xs opacity-90">
                  ({pendingSyncActions.length} actions pending)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* WebSocket connection indicator */}
      {networkStatus === 'online' && !isConnected && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto">
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
            <span className="text-sm font-medium">
              Reconnecting...
            </span>
          </div>
        </div>
      )}
    </>
  );
}