import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock AuthProvider for tests
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    return React.createElement('div', { 'data-testid': 'mock-auth-provider' }, children)
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
                gcTime: 0,
            },
        },
    })

    return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(MockAuthProvider, null, children)
    )
}

const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const createMockUser = (overrides = {}) => ({
    id: 'user-1',
    email: 'test@fairgo.com',
    name: 'Test User',
    role: 'USER' as const,
    language: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
})

export const createMockDriver = (overrides = {}) => ({
    id: 'driver-1',
    userId: 'user-driver-1',
    licenseNumber: 'KL123456789',
    vehicleNumber: 'KL01AB1234',
    vehicleType: 'CAR_ECONOMY',
    vehicleModel: 'Honda City',
    vehicleColor: 'White',
    isAvailable: true,
    isVerified: true,
    rating: 4.8,
    currentLocation: {
        lat: 9.9312,
        lng: 76.2673,
        address: 'Kochi, Kerala',
    },
    ...overrides,
})

export const createMockBooking = (overrides = {}) => ({
    id: 'booking-1',
    userId: 'user-1',
    driverId: 'driver-1',
    pickupLocation: 'Kochi Railway Station',
    dropLocation: 'Cochin International Airport',
    pickupCoords: { lat: 9.9312, lng: 76.2673 },
    dropCoords: { lat: 10.1520, lng: 76.4019 },
    vehicleType: 'CAR_ECONOMY',
    status: 'REQUESTED' as const,
    estimatedPrice: 450,
    actualPrice: undefined,
    finalPrice: undefined,
    estimatedDuration: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
})

export const createMockNotification = (overrides = {}) => ({
    id: 'notification-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info' as const,
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
})

// Helper functions
export const waitForLoadingToFinish = () =>
    new Promise((resolve) =>
        setTimeout(resolve, 0)
    )

export const setupGeolocationMock = (coords = { latitude: 9.9312, longitude: 76.2673 }) => {
    const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success) =>
            Promise.resolve(
                success({
                    coords: {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        accuracy: 10,
                    },
                })
            )
        ),
    }

    Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
    })

    return mockGeolocation
}

export const mockFetch = (response: any, status = 200) => {
    return jest.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => response,
    })
}

export const mockWebSocket = () => {
    const mockSocket = {
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        on: jest.fn(),
        emit: jest.fn(),
        connected: true,
    }

    return mockSocket
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }