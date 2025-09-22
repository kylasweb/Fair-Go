/**
 * FairGo Real-time WebSocket Integration
 * Handles live updates for bookings, driver tracking, and notifications
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore, useBookingStore, useNotificationStore, useUIStore } from './store';
import { queryClient } from './queries';
import type { Booking, Driver } from './store';

// WebSocket event types
export type SocketEvent =
    | 'booking:created'
    | 'booking:updated'
    | 'booking:cancelled'
    | 'booking:accepted'
    | 'driver:location-updated'
    | 'driver:status-changed'
    | 'notification:new'
    | 'system:announcement';

// WebSocket response types
export interface BookingUpdate {
    booking: Booking;
    driverId?: string;
    location?: { lat: number; lng: number };
}

export interface DriverLocationUpdate {
    driverId: string;
    location: { lat: number; lng: number; address?: string };
    timestamp: string;
}

export interface NotificationPayload {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
}

// WebSocket connection manager
class WebSocketManager {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private pingInterval: NodeJS.Timeout | null = null;

    connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            forceNew: false,
            autoConnect: true,
        });

        this.setupEventHandlers();
        return this.socket;
    }

    private setupEventHandlers() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            useUIStore.getState().setNetworkStatus('online');

            // Start ping/pong to keep connection alive
            this.startPingPong();

            // Join user-specific rooms
            const { user } = useAuthStore.getState();
            if (user) {
                this.socket?.emit('join:user-room', user.id);
                if (user.role === 'DRIVER') {
                    this.socket?.emit('join:driver-room', user.id);
                }
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            useUIStore.getState().setNetworkStatus('offline');
            this.stopPingPong();

            // Only attempt reconnection for recoverable disconnects
            if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
                this.attemptReconnection();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            useUIStore.getState().setNetworkStatus('offline');
            this.attemptReconnection();
        });

        // Business logic events
        this.setupBookingEvents();
        this.setupDriverEvents();
        this.setupNotificationEvents();
    }

    private setupBookingEvents() {
        if (!this.socket) return;

        // Booking created
        this.socket.on('booking:created', (data: BookingUpdate) => {
            const { updateBooking, fetchBookings } = useBookingStore.getState();
            updateBooking(data.booking.id, data.booking);
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            toast.success('New booking request received!');
        });

        // Booking updated
        this.socket.on('booking:updated', (data: BookingUpdate) => {
            const { updateBooking, activeBooking } = useBookingStore.getState();
            updateBooking(data.booking.id, data.booking);

            // Update active booking if it's the same one
            if (activeBooking?.id === data.booking.id) {
                useBookingStore.getState().setActiveBooking(data.booking);
            }

            queryClient.setQueryData(['booking', data.booking.id], data.booking);

            // Show status-specific notifications
            if (data.booking.status === 'ACCEPTED') {
                toast.success('Your booking has been accepted!');
            } else if (data.booking.status === 'IN_PROGRESS') {
                toast.info('Your ride has started!');
            } else if (data.booking.status === 'COMPLETED') {
                toast.success('Trip completed successfully!');
            }
        });

        // Booking cancelled
        this.socket.on('booking:cancelled', (data: BookingUpdate) => {
            const { updateBooking } = useBookingStore.getState();
            updateBooking(data.booking.id, { status: 'CANCELLED' });

            toast.error('Booking has been cancelled');
        });

        // Driver accepted booking
        this.socket.on('booking:accepted', (data: BookingUpdate) => {
            const { updateBooking } = useBookingStore.getState();
            updateBooking(data.booking.id, {
                status: 'ACCEPTED',
                driverId: data.driverId
            });

            toast.success('Driver found! They are on their way.');
        });
    }

    private setupDriverEvents() {
        if (!this.socket) return;

        // Driver location updates
        this.socket.on('driver:location-updated', (data: DriverLocationUpdate) => {
            // Update nearby drivers query cache
            queryClient.setQueriesData(
                { queryKey: ['nearby-drivers'] },
                (oldData: Driver[] | undefined) => {
                    if (!oldData) return oldData;

                    return oldData.map(driver =>
                        driver.id === data.driverId
                            ? { ...driver, currentLocation: data.location }
                            : driver
                    );
                }
            );

            // Update active booking driver location
            const { activeBooking, updateBooking } = useBookingStore.getState();
            if (activeBooking?.driverId === data.driverId && activeBooking.driver) {
                updateBooking(activeBooking.id, {
                    driver: {
                        ...activeBooking.driver,
                        currentLocation: {
                            lat: data.location.lat,
                            lng: data.location.lng,
                            address: data.location.address || 'Unknown location',
                        },
                    },
                });
            }
        });

        // Driver status changes
        this.socket.on('driver:status-changed', (data: {
            driverId: string;
            isAvailable: boolean;
            isVerified: boolean;
        }) => {
            // Update cached driver data
            queryClient.setQueriesData(
                { queryKey: ['nearby-drivers'] },
                (oldData: Driver[] | undefined) => {
                    if (!oldData) return oldData;

                    return oldData.map(driver =>
                        driver.id === data.driverId
                            ? { ...driver, isAvailable: data.isAvailable, isVerified: data.isVerified }
                            : driver
                    );
                }
            );
        });
    }

    private setupNotificationEvents() {
        if (!this.socket) return;

        // New notifications
        this.socket.on('notification:new', (data: NotificationPayload) => {
            const { addNotification } = useNotificationStore.getState();

            addNotification({
                title: data.title,
                message: data.message,
                type: data.type,
            });

            // Show toast notification
            switch (data.type) {
                case 'success':
                    toast.success(data.message);
                    break;
                case 'error':
                    toast.error(data.message);
                    break;
                case 'warning':
                    toast.warning(data.message);
                    break;
                default:
                    toast.info(data.message);
            }
        });

        // System announcements
        this.socket.on('system:announcement', (data: {
            title: string;
            message: string;
            priority: 'low' | 'medium' | 'high';
        }) => {
            const { addNotification } = useNotificationStore.getState();

            addNotification({
                title: data.title,
                message: data.message,
                type: data.priority === 'high' ? 'warning' : 'info',
            });

            if (data.priority === 'high') {
                toast.warning(data.message);
            }
        });
    }

    private startPingPong() {
        this.pingInterval = setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit('ping');
            }
        }, 25000); // Ping every 25 seconds
    }

    private stopPingPong() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            toast.error('Connection lost. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            if (this.socket && !this.socket.connected) {
                this.socket.connect();
            }
        }, delay);
    }

    emit(event: string, data?: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit event:', event);
        }
    }

    disconnect() {
        this.stopPingPong();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.reconnectAttempts = 0;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// React hook for WebSocket connection
export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const { isAuthenticated, token, user } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            // Disconnect if not authenticated
            if (socketRef.current) {
                wsManager.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Connect with authentication token
        const socket = wsManager.connect(token);
        socketRef.current = socket;

        // Monitor connection status
        const checkConnection = () => {
            setIsConnected(wsManager.isConnected());
        };

        const interval = setInterval(checkConnection, 1000);
        checkConnection(); // Initial check

        return () => {
            clearInterval(interval);
        };
    }, [isAuthenticated, token]);

    // Disconnect on component unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                wsManager.disconnect();
            }
        };
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        emit: wsManager.emit.bind(wsManager),
        disconnect: wsManager.disconnect.bind(wsManager),
    };
};

// Hook for driver-specific WebSocket features
export const useDriverWebSocket = () => {
    const { socket, isConnected, emit } = useWebSocket();
    const { user } = useAuthStore();
    const updateLocationMutation = useRef<NodeJS.Timeout | null>(null);

    // Update driver location periodically
    const startLocationTracking = () => {
        if (user?.role !== 'DRIVER' || !isConnected) return;

        const updateLocation = () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const location = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        emit('driver:update-location', location);
                    },
                    (error) => {
                        console.warn('Failed to get location:', error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 30000
                    }
                );
            }
        };

        // Update immediately and then every 30 seconds
        updateLocation();
        updateLocationMutation.current = setInterval(updateLocation, 30000);
    };

    const stopLocationTracking = () => {
        if (updateLocationMutation.current) {
            clearInterval(updateLocationMutation.current);
            updateLocationMutation.current = null;
        }
    };

    const updateDriverStatus = (isAvailable: boolean) => {
        emit('driver:update-status', { isAvailable });
    };

    const acceptBooking = (bookingId: string) => {
        emit('booking:accept', { bookingId });
    };

    const updateTripStatus = (bookingId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
        emit('booking:update-status', { bookingId, status });
    };

    useEffect(() => {
        if (isConnected && user?.role === 'DRIVER') {
            startLocationTracking();
        } else {
            stopLocationTracking();
        }

        return () => {
            stopLocationTracking();
        };
    }, [isConnected, user?.role]);

    return {
        isConnected,
        startLocationTracking,
        stopLocationTracking,
        updateDriverStatus,
        acceptBooking,
        updateTripStatus,
    };
};

// Hook for user-specific WebSocket features
export const useUserWebSocket = () => {
    const { isConnected, emit } = useWebSocket();

    const requestRide = (bookingData: Partial<Booking>) => {
        emit('booking:create', bookingData);
    };

    const cancelBooking = (bookingId: string) => {
        emit('booking:cancel', { bookingId });
    };

    const trackDriver = (bookingId: string) => {
        emit('booking:track-driver', { bookingId });
    };

    return {
        isConnected,
        requestRide,
        cancelBooking,
        trackDriver,
    };
};

// Export for direct usage
export { wsManager };
export default useWebSocket;