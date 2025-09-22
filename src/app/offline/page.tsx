'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, RefreshCw, Home, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FairGoLogo } from '@/components/fairgo-logo';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Redirect to home when back online
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  }, [isOnline, router]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Try to fetch a small resource to test connection
      await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      // If successful, redirect to home
      router.push('/');
    } catch (error) {
      // Still offline
      console.log('Still offline');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FairGoLogo className="h-12 w-auto" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                Back Online!
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                You're Offline
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isOnline
              ? "Great! Your connection has been restored. Redirecting..."
              : "It looks like you've lost your internet connection. Don't worry, you can still browse cached content."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isOnline ? (
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-sm text-gray-600 mt-2">Reconnecting...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Button 
                  onClick={handleRetry} 
                  disabled={retrying}
                  className="w-full"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking Connection...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => router.push('/')} 
                  variant="outline"
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Cached Home
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-sm text-gray-900 mb-2">
                  What you can do offline:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View your recent bookings</li>
                  <li>• Browse cached content</li>
                  <li>• Access emergency contacts</li>
                  <li>• Prepare your next booking</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-sm text-gray-900 mb-2">
                  Emergency Contact:
                </h3>
                <Button 
                  onClick={() => window.open('tel:+1234567890')}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call FairGo Support
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}