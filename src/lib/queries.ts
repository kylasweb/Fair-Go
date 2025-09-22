/**
 * React Query Configuration and Custom Hooks
 * Server state management with caching, background updates, and offline support
 */

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore, useNotificationStore, useUIStore } from './store';
import type { Booking, Driver, User } from './store';

// Query client configuration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error: any) => {
                // Don't retry on authentication errors
                if (error?.status === 401 || error?.status === 403) {
                    return false;
                }
                // Retry up to 3 times for network errors
                return failureCount < 3;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst', // Try cache first when offline
        },
        mutations: {
            networkMode: 'offlineFirst',
            retry: 1,
            onError: (error: any) => {
                toast.error(error.message || 'An error occurred');
            },
        },
    },
});

// API utility functions
const createAuthenticatedFetch = () => {
    return async (url: string, options: RequestInit = {}) => {
        const { token } = useAuthStore.getState();

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        };

        const response = await fetch(url, config);

        // Handle authentication errors
        if (response.status === 401) {
            useAuthStore.getState().logout();
            toast.error('Session expired. Please log in again.');
            throw new Error('Unauthorized');
        }

        // Handle other HTTP errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    };
};

const api = createAuthenticatedFetch();

// Custom hooks for data fetching
export const useBookingsQuery = () => {
    return useQuery({
        queryKey: ['bookings'],
        queryFn: () => api('/api/bookings'),
        enabled: useAuthStore.getState().isAuthenticated,
    });
};

export const useActiveBookingQuery = (bookingId?: string) => {
    return useQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => api(`/api/bookings/${bookingId}`),
        enabled: !!bookingId,
        refetchInterval: 5000, // Poll every 5 seconds for active bookings
    });
};

export const useNearbyDriversQuery = (location: { lat: number; lng: number } | null) => {
    return useQuery({
        queryKey: ['nearby-drivers', location],
        queryFn: () => api(`/api/drivers/nearby?lat=${location!.lat}&lng=${location!.lng}`),
        enabled: !!location,
        staleTime: 30 * 1000, // 30 seconds - drivers move frequently
        refetchInterval: 15000, // Refresh every 15 seconds
    });
};

export const useDriverProfileQuery = (driverId?: string) => {
    return useQuery({
        queryKey: ['driver-profile', driverId],
        queryFn: () => api(`/api/drivers/profile/${driverId}`),
        enabled: !!driverId,
    });
};

export const useUserProfileQuery = () => {
    const { isAuthenticated, user } = useAuthStore();

    return useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: () => api('/api/auth/me'),
        enabled: isAuthenticated && !!user,
    });
};

// Mutation hooks
export const useCreateBookingMutation = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotificationStore.getState();

    return useMutation({
        mutationFn: (bookingData: Partial<Booking>) => api('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        }),
        onSuccess: (booking: Booking) => {
            // Invalidate and refetch bookings
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            // Add success notification
            addNotification({
                title: 'Booking Created',
                message: `Your ride to ${booking.dropLocation} has been requested.`,
                type: 'success',
            });

            toast.success('Booking created successfully!');
        },
        onError: (error: any) => {
            addNotification({
                title: 'Booking Failed',
                message: error.message || 'Failed to create booking',
                type: 'error',
            });
        },
    });
};

export const useUpdateBookingMutation = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotificationStore.getState();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
            api(`/api/bookings/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            }),
        onSuccess: (updatedBooking: Booking) => {
            // Update cached data
            queryClient.setQueryData(['booking', updatedBooking.id], updatedBooking);
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            // Add notification based on status update
            if (updatedBooking.status === 'ACCEPTED') {
                addNotification({
                    title: 'Driver Found!',
                    message: 'A driver has accepted your booking.',
                    type: 'success',
                });
            } else if (updatedBooking.status === 'IN_PROGRESS') {
                addNotification({
                    title: 'Trip Started',
                    message: 'Your driver is on the way!',
                    type: 'info',
                });
            } else if (updatedBooking.status === 'COMPLETED') {
                addNotification({
                    title: 'Trip Completed',
                    message: 'Hope you had a great ride!',
                    type: 'success',
                });
            }
        },
    });
};

export const useCancelBookingMutation = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotificationStore.getState();

    return useMutation({
        mutationFn: (bookingId: string) => api(`/api/bookings/${bookingId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'CANCELLED' }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            addNotification({
                title: 'Booking Cancelled',
                message: 'Your booking has been cancelled successfully.',
                type: 'info',
            });
            toast.success('Booking cancelled');
        },
    });
};

export const useDriverRegistrationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (driverData: any) => api('/api/drivers/register', {
            method: 'POST',
            body: JSON.stringify(driverData),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success('Driver registration submitted for review');
        },
    });
};

export const useUpdateDriverLocationMutation = () => {
    return useMutation({
        mutationFn: (location: { lat: number; lng: number }) =>
            api('/api/drivers/location', {
                method: 'PATCH',
                body: JSON.stringify(location),
            }),
        // Don't show notifications for location updates
        onError: () => {
            console.warn('Failed to update driver location');
        },
    });
};

// Background sync for offline actions
type SyncAction = {
    type: string;
    data: any;
    timestamp: number;
};

type SyncResult = SyncAction & {
    result?: any;
    error?: any;
    status: 'success' | 'failed';
};

export const useSyncPendingActions = () => {
    const queryClient = useQueryClient();
    const { pendingSyncActions, clearPendingSyncActions } = useUIStore();

    return useMutation({
        mutationFn: async (): Promise<SyncResult[]> => {
            const actions = pendingSyncActions;
            const results: SyncResult[] = [];

            for (const action of actions) {
                try {
                    let result;
                    switch (action.type) {
                        case 'CREATE_BOOKING':
                            result = await api('/api/bookings', {
                                method: 'POST',
                                body: JSON.stringify(action.data),
                            });
                            break;
                        case 'UPDATE_BOOKING':
                            result = await api(`/api/bookings/${action.data.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify(action.data.updates),
                            });
                            break;
                        case 'CANCEL_BOOKING':
                            result = await api(`/api/bookings/${action.data.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: 'CANCELLED' }),
                            });
                            break;
                        default:
                            console.warn('Unknown sync action:', action.type);
                            continue;
                    }
                    results.push({ ...action, result, status: 'success' });
                } catch (error) {
                    results.push({ ...action, error, status: 'failed' });
                }
            }

            return results;
        },
        onSuccess: (results) => {
            const successful = results.filter(r => r.status === 'success');
            const failed = results.filter(r => r.status === 'failed');

            if (successful.length > 0) {
                queryClient.invalidateQueries({ queryKey: ['bookings'] });
                toast.success(`${successful.length} actions synced successfully`);
            }

            if (failed.length > 0) {
                toast.error(`${failed.length} actions failed to sync`);
            }

            // Clear successfully synced actions
            if (successful.length === pendingSyncActions.length) {
                clearPendingSyncActions();
            }
        },
    });
};

// Provider component
interface QueryProviderProps {
    children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
    return (
        React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
};

// Network status monitoring
export const useNetworkStatus = () => {
    const { setNetworkStatus } = useUIStore();
    const syncMutation = useSyncPendingActions();

    // Monitor network status
    React.useEffect(() => {
        const updateNetworkStatus = () => {
            const status = navigator.onLine ? 'online' : 'offline';
            setNetworkStatus(status);

            // Sync pending actions when coming back online
            if (status === 'online' && useUIStore.getState().pendingSyncActions.length > 0) {
                syncMutation.mutate();
            }
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);
        };
    }, [setNetworkStatus, syncMutation]);
};

// Export query client for advanced usage
export { queryClient };