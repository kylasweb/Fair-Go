import { renderHook, act } from '@testing-library/react'
import {
    useAuthStore,
    useBookingStore,
    useNotificationStore,
    useUIStore
} from '@/lib/store'
import { createMockUser, createMockBooking, createMockDriver } from '@/test-utils'

// Mock fetch
global.fetch = jest.fn()

describe('useAuthStore', () => {
    beforeEach(() => {
        // Reset store state
        useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        })
        jest.clearAllMocks()
    })

    it('initializes with default state', () => {
        const { result } = renderHook(() => useAuthStore())

        expect(result.current.user).toBeNull()
        expect(result.current.token).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isLoading).toBe(false)
    })

    it('handles successful login', async () => {
        const mockUser = createMockUser()
        const mockToken = 'mock-token'

            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ user: mockUser, token: mockToken }),
            })

        const { result } = renderHook(() => useAuthStore())

        await act(async () => {
            await result.current.login('test@fairgo.com', 'password')
        })

        expect(result.current.user).toEqual(mockUser)
        expect(result.current.token).toBe(mockToken)
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isLoading).toBe(false)
    })

    it('handles login failure', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Invalid credentials' }),
        })

        const { result } = renderHook(() => useAuthStore())

        await act(async () => {
            try {
                await result.current.login('test@fairgo.com', 'wrong-password')
            } catch (error) {
                expect((error as Error).message).toBe('Invalid credentials')
            }
        })

        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isLoading).toBe(false)
    })

    it('handles logout', () => {
        const { result } = renderHook(() => useAuthStore())

        // Set authenticated state
        act(() => {
            useAuthStore.setState({
                user: createMockUser(),
                token: 'mock-token',
                isAuthenticated: true,
            })
        })

        expect(result.current.isAuthenticated).toBe(true)

        act(() => {
            result.current.logout()
        })

        expect(result.current.user).toBeNull()
        expect(result.current.token).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
    })

    it('updates user information', () => {
        const mockUser = createMockUser()
        const { result } = renderHook(() => useAuthStore())

        // Set initial user
        act(() => {
            useAuthStore.setState({
                user: mockUser,
                isAuthenticated: true,
            })
        })

        // Update user
        act(() => {
            result.current.updateUser({ name: 'Updated Name' })
        })

        expect(result.current.user?.name).toBe('Updated Name')
        expect(result.current.user?.email).toBe(mockUser.email)
    })
})

describe('useBookingStore', () => {
    beforeEach(() => {
        useBookingStore.setState({
            bookings: [],
            activeBooking: null,
            nearbyDrivers: [],
            isLoading: false,
            error: null,
        })
        jest.clearAllMocks()
    })

    it('initializes with default state', () => {
        const { result } = renderHook(() => useBookingStore())

        expect(result.current.bookings).toEqual([])
        expect(result.current.activeBooking).toBeNull()
        expect(result.current.nearbyDrivers).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('creates a booking successfully', async () => {
        const mockBooking = createMockBooking()

            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBooking,
            })

        // Mock auth state
        useAuthStore.setState({
            token: 'mock-token',
            isAuthenticated: true,
        })

        const { result } = renderHook(() => useBookingStore())

        await act(async () => {
            const booking = await result.current.createBooking({
                pickupLocation: 'Kochi',
                dropLocation: 'Ernakulam',
                vehicleType: 'CAR_ECONOMY',
                estimatedPrice: 100,
            })
            expect(booking).toEqual(mockBooking)
        })

        expect(result.current.bookings).toContain(mockBooking)
        expect(result.current.activeBooking).toEqual(mockBooking)
        expect(result.current.isLoading).toBe(false)
    })

    it('handles booking creation failure', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Booking failed' }),
        })

        useAuthStore.setState({
            token: 'mock-token',
            isAuthenticated: true,
        })

        const { result } = renderHook(() => useBookingStore())

        await act(async () => {
            try {
                await result.current.createBooking({
                    pickupLocation: 'Kochi',
                    dropLocation: 'Ernakulam',
                    vehicleType: 'CAR_ECONOMY',
                    estimatedPrice: 100,
                })
            } catch (error) {
                expect((error as Error).message).toBe('Booking failed')
            }
        })

        expect(result.current.error).toBe('Booking failed')
        expect(result.current.isLoading).toBe(false)
    })

    it('updates booking status', () => {
        const mockBooking = createMockBooking()
        const { result } = renderHook(() => useBookingStore())

        // Set initial booking
        act(() => {
            useBookingStore.setState({
                bookings: [mockBooking],
                activeBooking: mockBooking,
            })
        })

        // Update booking
        act(() => {
            result.current.updateBooking(mockBooking.id, { status: 'ACCEPTED' })
        })

        expect(result.current.bookings[0].status).toBe('ACCEPTED')
        expect(result.current.activeBooking?.status).toBe('ACCEPTED')
    })

    it('sets active booking', () => {
        const mockBooking = createMockBooking()
        const { result } = renderHook(() => useBookingStore())

        act(() => {
            result.current.setActiveBooking(mockBooking)
        })

        expect(result.current.activeBooking).toEqual(mockBooking)
    })

    it('cancels booking', async () => {
        const mockBooking = createMockBooking()

            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
            })

        useAuthStore.setState({
            token: 'mock-token',
            isAuthenticated: true,
        })

        const { result } = renderHook(() => useBookingStore())

        // Set initial booking
        act(() => {
            useBookingStore.setState({
                bookings: [mockBooking],
                activeBooking: mockBooking,
            })
        })

        await act(async () => {
            await result.current.cancelBooking(mockBooking.id)
        })

        expect(result.current.bookings[0].status).toBe('CANCELLED')
        expect(result.current.activeBooking?.status).toBe('CANCELLED')
    })
})

describe('useNotificationStore', () => {
    beforeEach(() => {
        useNotificationStore.setState({
            notifications: [],
            unreadCount: 0,
        })
    })

    it('initializes with default state', () => {
        const { result } = renderHook(() => useNotificationStore())

        expect(result.current.notifications).toEqual([])
        expect(result.current.unreadCount).toBe(0)
    })

    it('adds notification', () => {
        const { result } = renderHook(() => useNotificationStore())

        act(() => {
            result.current.addNotification({
                title: 'Test Notification',
                message: 'This is a test',
                type: 'info',
            })
        })

        expect(result.current.notifications).toHaveLength(1)
        expect(result.current.notifications[0].title).toBe('Test Notification')
        expect(result.current.notifications[0].read).toBe(false)
        expect(result.current.unreadCount).toBe(1)
    })

    it('marks notification as read', () => {
        const { result } = renderHook(() => useNotificationStore())

        // Add notification
        act(() => {
            result.current.addNotification({
                title: 'Test Notification',
                message: 'This is a test',
                type: 'info',
            })
        })

        const notificationId = result.current.notifications[0].id

        // Mark as read
        act(() => {
            result.current.markAsRead(notificationId)
        })

        expect(result.current.notifications[0].read).toBe(true)
        expect(result.current.unreadCount).toBe(0)
    })

    it('marks all notifications as read', () => {
        const { result } = renderHook(() => useNotificationStore())

        // Add multiple notifications
        act(() => {
            result.current.addNotification({
                title: 'Test 1',
                message: 'Test message 1',
                type: 'info',
            })
            result.current.addNotification({
                title: 'Test 2',
                message: 'Test message 2',
                type: 'success',
            })
        })

        expect(result.current.unreadCount).toBe(2)

        // Mark all as read
        act(() => {
            result.current.markAllAsRead()
        })

        expect(result.current.unreadCount).toBe(0)
        result.current.notifications.forEach(notification => {
            expect(notification.read).toBe(true)
        })
    })

    it('removes notification', () => {
        const { result } = renderHook(() => useNotificationStore())

        // Add notification
        act(() => {
            result.current.addNotification({
                title: 'Test Notification',
                message: 'This is a test',
                type: 'info',
            })
        })

        expect(result.current.notifications).toHaveLength(1)
        expect(result.current.unreadCount).toBe(1)

        const notificationId = result.current.notifications[0].id

        // Remove notification
        act(() => {
            result.current.removeNotification(notificationId)
        })

        expect(result.current.notifications).toHaveLength(0)
        expect(result.current.unreadCount).toBe(0)
    })

    it('clears all notifications', () => {
        const { result } = renderHook(() => useNotificationStore())

        // Add multiple notifications
        act(() => {
            result.current.addNotification({
                title: 'Test 1',
                message: 'Test message 1',
                type: 'info',
            })
            result.current.addNotification({
                title: 'Test 2',
                message: 'Test message 2',
                type: 'success',
            })
        })

        expect(result.current.notifications).toHaveLength(2)

        // Clear all
        act(() => {
            result.current.clearAllNotifications()
        })

        expect(result.current.notifications).toHaveLength(0)
        expect(result.current.unreadCount).toBe(0)
    })
})

describe('useUIStore', () => {
    beforeEach(() => {
        useUIStore.setState({
            isSidebarOpen: false,
            isOffline: false,
            networkStatus: 'online',
            pendingSyncActions: [],
        })
    })

    it('initializes with default state', () => {
        const { result } = renderHook(() => useUIStore())

        expect(result.current.isSidebarOpen).toBe(false)
        expect(result.current.isOffline).toBe(false)
        expect(result.current.networkStatus).toBe('online')
        expect(result.current.pendingSyncActions).toEqual([])
    })

    it('toggles sidebar', () => {
        const { result } = renderHook(() => useUIStore())

        act(() => {
            result.current.setSidebarOpen(true)
        })

        expect(result.current.isSidebarOpen).toBe(true)

        act(() => {
            result.current.setSidebarOpen(false)
        })

        expect(result.current.isSidebarOpen).toBe(false)
    })

    it('updates network status', () => {
        const { result } = renderHook(() => useUIStore())

        act(() => {
            result.current.setNetworkStatus('offline')
        })

        expect(result.current.networkStatus).toBe('offline')
        expect(result.current.isOffline).toBe(true)

        act(() => {
            result.current.setNetworkStatus('online')
        })

        expect(result.current.networkStatus).toBe('online')
        expect(result.current.isOffline).toBe(false)
    })

    it('manages pending sync actions', () => {
        const { result } = renderHook(() => useUIStore())

        const action = {
            type: 'CREATE_BOOKING',
            data: { pickupLocation: 'Kochi', dropLocation: 'Ernakulam' },
        }

        act(() => {
            result.current.addPendingSyncAction(action)
        })

        expect(result.current.pendingSyncActions).toHaveLength(1)
        expect(result.current.pendingSyncActions[0].type).toBe('CREATE_BOOKING')
        expect(result.current.pendingSyncActions[0]).toHaveProperty('timestamp')

        act(() => {
            result.current.clearPendingSyncActions()
        })

        expect(result.current.pendingSyncActions).toHaveLength(0)
    })
})