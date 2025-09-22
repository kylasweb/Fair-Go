/**
 * FairGo Global State Management
 * Using Zustand for performance and simplicity
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// Types
export interface User {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    role: 'USER' | 'DRIVER' | 'ADMIN';
    language: string;
    avatar?: string;
}

export interface Driver {
    id: string;
    userId: string;
    licenseNumber: string;
    vehicleNumber: string;
    vehicleType: string;
    vehicleModel: string;
    vehicleColor: string;
    isAvailable: boolean;
    isVerified: boolean;
    rating: number;
    currentLocation?: {
        lat: number;
        lng: number;
        address: string;
    };
}

export interface Booking {
    id: string;
    userId: string;
    driverId?: string;
    pickupLocation: string;
    dropLocation: string;
    pickupCoords?: { lat: number; lng: number };
    dropCoords?: { lat: number; lng: number };
    vehicleType: string;
    status: 'REQUESTED' | 'ACCEPTED' | 'CONFIRMED' | 'DRIVER_ARRIVED' | 'PICKED_UP' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_DRIVER_AVAILABLE';
    estimatedPrice: number;
    actualPrice?: number;
    estimatedDuration?: number;
    createdAt: string;
    driver?: Driver;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    action?: {
        label: string;
        handler: () => void;
    };
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
    };
    location: {
        enabled: boolean;
        highAccuracy: boolean;
    };
    offline: {
        enabled: boolean;
        syncOnConnection: boolean;
    };
}

// Store interfaces
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    checkAuth: () => Promise<void>;
}

interface BookingState {
    bookings: Booking[];
    activeBooking: Booking | null;
    nearbyDrivers: Driver[];
    isLoading: boolean;
    error: string | null;
    createBooking: (bookingData: Partial<Booking>) => Promise<Booking>;
    updateBooking: (id: string, updates: Partial<Booking>) => void;
    cancelBooking: (id: string) => Promise<void>;
    setActiveBooking: (booking: Booking | null) => void;
    fetchBookings: () => Promise<void>;
    fetchNearbyDrivers: (location: { lat: number; lng: number }) => Promise<void>;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
}

interface UIState {
    isSidebarOpen: boolean;
    isOffline: boolean;
    networkStatus: 'online' | 'offline' | 'slow';
    pendingSyncActions: Array<{ type: string; data: any; timestamp: number }>;
    setSidebarOpen: (open: boolean) => void;
    setNetworkStatus: (status: 'online' | 'offline' | 'slow') => void;
    addPendingSyncAction: (action: { type: string; data: any }) => void;
    clearPendingSyncActions: () => void;
}

interface SettingsState {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

// Create stores
export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set, get) => ({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,

                login: async (email: string, password: string) => {
                    set({ isLoading: true });
                    try {
                        const response = await fetch('/api/auth/signin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password }),
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message);
                        }

                        const { user, token } = await response.json();
                        set({ user, token, isAuthenticated: true, isLoading: false });
                    } catch (error) {
                        set({ isLoading: false });
                        throw error;
                    }
                },

                logout: () => {
                    set({ user: null, token: null, isAuthenticated: false });
                },

                updateUser: (updates: Partial<User>) => {
                    const { user } = get();
                    if (user) {
                        set({ user: { ...user, ...updates } });
                    }
                },

                checkAuth: async () => {
                    const { token } = get();
                    if (!token) return;

                    try {
                        const response = await fetch('/api/auth/me', {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });

                        if (response.ok) {
                            const user = await response.json();
                            set({ user, isAuthenticated: true });
                        } else {
                            set({ user: null, token: null, isAuthenticated: false });
                        }
                    } catch (error) {
                        console.error('Auth check failed:', error);
                        set({ user: null, token: null, isAuthenticated: false });
                    }
                },
            }),
            { name: 'auth-store' }
        ),
        { name: 'AuthStore' }
    )
);

export const useBookingStore = create<BookingState>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            bookings: [],
            activeBooking: null,
            nearbyDrivers: [],
            isLoading: false,
            error: null,

            createBooking: async (bookingData: Partial<Booking>): Promise<Booking> => {
                set({ isLoading: true, error: null });
                try {
                    const { token } = useAuthStore.getState();
                    const response = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(bookingData),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message);
                    }

                    const booking = await response.json();
                    set((state) => ({
                        bookings: [booking, ...state.bookings],
                        activeBooking: booking,
                        isLoading: false,
                    }));

                    return booking;
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message });
                    throw error;
                }
            },

            updateBooking: (id: string, updates: Partial<Booking>) => {
                set((state) => ({
                    bookings: state.bookings.map((booking) =>
                        booking.id === id ? { ...booking, ...updates } : booking
                    ),
                    activeBooking: state.activeBooking?.id === id
                        ? { ...state.activeBooking, ...updates }
                        : state.activeBooking,
                }));
            },

            cancelBooking: async (id: string) => {
                try {
                    const { token } = useAuthStore.getState();
                    const response = await fetch(`/api/bookings/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ status: 'CANCELLED' }),
                    });

                    if (response.ok) {
                        get().updateBooking(id, { status: 'CANCELLED' });
                    }
                } catch (error) {
                    console.error('Failed to cancel booking:', error);
                }
            },

            setActiveBooking: (booking: Booking | null) => {
                set({ activeBooking: booking });
            },

            fetchBookings: async () => {
                set({ isLoading: true });
                try {
                    const { token } = useAuthStore.getState();
                    const response = await fetch('/api/bookings', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (response.ok) {
                        const bookings = await response.json();
                        set({ bookings, isLoading: false });
                    }
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message });
                }
            },

            fetchNearbyDrivers: async (location: { lat: number; lng: number }) => {
                try {
                    const response = await fetch(`/api/drivers/nearby?lat=${location.lat}&lng=${location.lng}`);
                    if (response.ok) {
                        const drivers = await response.json();
                        set({ nearbyDrivers: drivers });
                    }
                } catch (error) {
                    console.error('Failed to fetch nearby drivers:', error);
                }
            },
        })),
        { name: 'BookingStore' }
    )
);

export const useNotificationStore = create<NotificationState>()(
    devtools(
        persist(
            (set, get) => ({
                notifications: [],
                unreadCount: 0,

                addNotification: (notification) => {
                    const id = `notification_${Date.now()}_${Math.random()}`;
                    const newNotification: Notification = {
                        ...notification,
                        id,
                        read: false,
                        createdAt: new Date().toISOString(),
                    };

                    set((state) => ({
                        notifications: [newNotification, ...state.notifications],
                        unreadCount: state.unreadCount + 1,
                    }));
                },

                markAsRead: (id: string) => {
                    set((state) => ({
                        notifications: state.notifications.map((n) =>
                            n.id === id ? { ...n, read: true } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1),
                    }));
                },

                markAllAsRead: () => {
                    set((state) => ({
                        notifications: state.notifications.map((n) => ({ ...n, read: true })),
                        unreadCount: 0,
                    }));
                },

                removeNotification: (id: string) => {
                    set((state) => ({
                        notifications: state.notifications.filter((n) => n.id !== id),
                        unreadCount: state.notifications.find((n) => n.id === id && !n.read)
                            ? state.unreadCount - 1
                            : state.unreadCount,
                    }));
                },

                clearAllNotifications: () => {
                    set({ notifications: [], unreadCount: 0 });
                },
            }),
            { name: 'notification-store' }
        ),
        { name: 'NotificationStore' }
    )
);

export const useUIStore = create<UIState>()(
    devtools(
        (set) => ({
            isSidebarOpen: false,
            isOffline: false,
            networkStatus: 'online',
            pendingSyncActions: [],

            setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

            setNetworkStatus: (status: 'online' | 'offline' | 'slow') => {
                set({ networkStatus: status, isOffline: status === 'offline' });
            },

            addPendingSyncAction: (action: { type: string; data: any }) => {
                set((state) => ({
                    pendingSyncActions: [
                        ...state.pendingSyncActions,
                        { ...action, timestamp: Date.now() },
                    ],
                }));
            },

            clearPendingSyncActions: () => set({ pendingSyncActions: [] }),
        }),
        { name: 'UIStore' }
    )
);

export const useSettingsStore = create<SettingsState>()(
    devtools(
        persist(
            (set) => ({
                settings: {
                    theme: 'system',
                    language: 'en',
                    notifications: {
                        push: true,
                        email: true,
                        sms: false,
                    },
                    location: {
                        enabled: true,
                        highAccuracy: false,
                    },
                    offline: {
                        enabled: true,
                        syncOnConnection: true,
                    },
                },

                updateSettings: (updates: Partial<AppSettings>) => {
                    set((state) => ({
                        settings: { ...state.settings, ...updates },
                    }));
                },

                resetSettings: () => {
                    set({
                        settings: {
                            theme: 'system',
                            language: 'en',
                            notifications: {
                                push: true,
                                email: true,
                                sms: false,
                            },
                            location: {
                                enabled: true,
                                highAccuracy: false,
                            },
                            offline: {
                                enabled: true,
                                syncOnConnection: true,
                            },
                        },
                    });
                },
            }),
            { name: 'settings-store' }
        ),
        { name: 'SettingsStore' }
    )
);

// Utility hooks
export const useAuth = () => useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login: state.login,
    logout: state.logout,
}));

export const useBookings = () => useBookingStore((state) => ({
    bookings: state.bookings,
    activeBooking: state.activeBooking,
    isLoading: state.isLoading,
    createBooking: state.createBooking,
    fetchBookings: state.fetchBookings,
}));

export const useNotifications = () => useNotificationStore((state) => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification: state.addNotification,
    markAsRead: state.markAsRead,
}));

// Store subscriptions for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    useAuthStore.subscribe((state) => {
        console.log('Auth state changed:', state);
    });

    useBookingStore.subscribe((state) => {
        console.log('Booking state changed:', state);
    });
}