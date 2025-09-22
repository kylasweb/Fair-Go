import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockUser, createMockDriver, setupGeolocationMock, mockFetch } from '@/test-utils'
import { BookingInterface } from '@/components/booking-interface'
import { useAuthStore, useBookingStore, useAuth, useBookings, Booking } from '@/lib/store'
import { useCreateBookingMutation } from '@/lib/queries'
import { useUserWebSocket } from '@/lib/websocket'
import * as queries from '@/lib/queries'

// Mock the stores
jest.mock('@/lib/store', () => ({
  useAuth: jest.fn(),
  useBookings: jest.fn(),
  useAuthStore: {
    getState: jest.fn(),
  },
  useBookingStore: {
    getState: jest.fn(),
  },
}))

// Mock the queries
jest.mock('@/lib/queries', () => ({
  useCreateBookingMutation: jest.fn(),
}))

// Mock the websocket
jest.mock('@/lib/websocket', () => ({
  useUserWebSocket: jest.fn(),
}))

// Mock the queries
const createBookingMock = jest.fn().mockResolvedValue({ id: 'booking-1' })

jest.mock('@/lib/queries', () => ({
  useCreateBookingMutation: () => ({
    mutateAsync: createBookingMock,
    isPending: false,
  }),
  useNearbyDriversQuery: () => ({
    data: [createMockDriver()],
    isLoading: false,
  }),
}))

// Mock the websocket
jest.mock('@/lib/websocket', () => ({
  useUserWebSocket: () => ({
    isConnected: true,
  }),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

describe('BookingInterface', () => {
  const mockUser = createMockUser()
  const mockOnBookRide = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated state
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(useBookings as jest.Mock).mockReturnValue({
      activeBooking: null,
    })

    // Setup geolocation mock
    setupGeolocationMock()
    
    // Mock fetch for geocoding
    global.fetch = mockFetch({
      results: [
        {
          formatted: 'Kochi, Kerala, India',
          geometry: { lat: 9.9312, lng: 76.2673 },
        },
      ],
    })
  })

  it('renders booking form correctly', () => {
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    expect(screen.getByLabelText(/pickup location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/drop location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/vehicle type/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /book ride now/i })).toBeInTheDocument()
  })

  it('shows current location button for pickup', () => {
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    const currentLocationButton = screen.getByRole('button', { name: /use current location/i })
    expect(currentLocationButton).toBeInTheDocument()
  })

  it('populates pickup location with current location', async () => {
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    // Wait for geolocation to be called
    await waitFor(() => {
      const pickupInput = screen.getByLabelText(/pickup location/i) as HTMLInputElement
      expect(pickupInput.value).toBeTruthy()
    })
  })

  it('allows user to enter locations and select vehicle type', async () => {
    const user = userEvent.setup()
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    const pickupInput = screen.getByLabelText(/pickup location/i)
    const dropInput = screen.getByLabelText(/drop location/i)
    const vehicleSelect = screen.getByLabelText(/vehicle type/i)

    await user.clear(pickupInput)
    await user.type(pickupInput, 'Kochi Railway Station')
    await user.type(dropInput, 'Cochin International Airport')
    
    await user.click(vehicleSelect)
    const economyOption = screen.getByText(/economy car/i)
    await user.click(economyOption)

    expect(pickupInput).toHaveValue('Kochi Railway Station')
    expect(dropInput).toHaveValue('Cochin International Airport')
  })

  it('calculates and displays estimated price', async () => {
    const user = userEvent.setup()
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    const pickupInput = screen.getByLabelText(/pickup location/i)
    const dropInput = screen.getByLabelText(/drop location/i)
    const vehicleSelect = screen.getByLabelText(/vehicle type/i)

    await user.clear(pickupInput)
    await user.type(pickupInput, 'Kochi Railway Station')
    await user.type(dropInput, 'Airport')
    
    await user.click(vehicleSelect)
    const economyOption = screen.getByText(/economy car/i)
    await user.click(economyOption)

    // Price should be calculated automatically
    await waitFor(() => {
      expect(screen.getByText(/estimated price/i)).toBeInTheDocument()
      expect(screen.getByText(/₹/)).toBeInTheDocument()
    })
  })

  it('shows nearby drivers when available', () => {
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    expect(screen.getByText(/1 driver nearby/i)).toBeInTheDocument()
  })

  it('creates booking when form is submitted', async () => {
    const user = userEvent.setup()
    const createBookingMock = jest.fn().mockResolvedValue({ id: 'booking-1' })
    
    // Mock the mutation
    jest.mocked(useCreateBookingMutation).mockReturnValue({
      mutateAsync: createBookingMock,
      mutate: jest.fn(),
      isPending: false as const,
      isError: false as const,
      isSuccess: false as const,
      isIdle: true as const,
      isPaused: false as const,
      error: null,
      data: undefined,
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
      reset: jest.fn(),
      status: 'idle' as const,
    })

    render(<BookingInterface onBookRide={mockOnBookRide} />)

    // Fill out the form
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const dropInput = screen.getByLabelText(/drop location/i)
    const vehicleSelect = screen.getByLabelText(/vehicle type/i)

    await user.clear(pickupInput)
    await user.type(pickupInput, 'Kochi Railway Station')
    await user.type(dropInput, 'Airport')
    
    await user.click(vehicleSelect)
    const economyOption = screen.getByText(/economy car/i)
    await user.click(economyOption)

    // Wait for price calculation
    await waitFor(() => {
      expect(screen.getByText(/estimated price/i)).toBeInTheDocument()
    })

    // Submit the form
    const bookButton = screen.getByRole('button', { name: /book ride now/i })
    expect(bookButton).not.toBeDisabled()
    
    await user.click(bookButton)

    await waitFor(() => {
      expect(createBookingMock).toHaveBeenCalledWith({
        pickupLocation: 'Kochi Railway Station',
        dropLocation: 'Airport',
        pickupCoords: null,
        dropCoords: null,
        vehicleType: 'CAR_ECONOMY',
        estimatedPrice: expect.any(Number),
        userId: mockUser.id,
      })
    })
  })

  it('shows error when user is not authenticated', async () => {
    // Mock unauthenticated state
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    const user = userEvent.setup()
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    // Fill out the form
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const dropInput = screen.getByLabelText(/drop location/i)

    await user.type(pickupInput, 'Kochi Railway Station')
    await user.type(dropInput, 'Airport')

    // Button should show sign in message
    expect(screen.getByText(/please sign in to book a ride/i)).toBeInTheDocument()
  })

  it('shows active booking when user has one', () => {
    const activeBooking = {
      id: 'booking-1',
      pickupLocation: 'Kochi Railway Station',
      dropLocation: 'Airport',
      status: 'ACCEPTED' as const,
      estimatedPrice: 450,
      driver: { userId: 'driver-1' },
    }

    ;(useBookings as jest.Mock).mockReturnValue({
      activeBooking,
    })

    render(<BookingInterface onBookRide={mockOnBookRide} />)

    expect(screen.getByText(/active booking/i)).toBeInTheDocument()
    expect(screen.getByText('Kochi Railway Station')).toBeInTheDocument()
    expect(screen.getByText('Airport')).toBeInTheDocument()
    expect(screen.getByText('₹450')).toBeInTheDocument()
  })

  it('shows offline indicator when not connected', () => {
    // Mock offline state
    jest.mocked(useUserWebSocket).mockReturnValue({
      isConnected: false,
      requestRide: jest.fn(),
      cancelBooking: jest.fn(),
      trackDriver: jest.fn(),
    })

    render(<BookingInterface onBookRide={mockOnBookRide} />)

    expect(screen.getByText(/offline mode/i)).toBeInTheDocument()
  })

  it('shows voice booking alternative', () => {
    render(<BookingInterface onBookRide={mockOnBookRide} />)

    expect(screen.getByText(/book with voice command/i)).toBeInTheDocument()
    expect(screen.getByText(/book a ride from kochi to ernakulam/i)).toBeInTheDocument()
  })
})

describe('BookingInterface Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles geolocation errors gracefully', async () => {
    // Mock geolocation error
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success, error) =>
        error({ code: 1, message: 'Permission denied' })
      ),
    }
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    })

    ;(useAuth as jest.Mock).mockReturnValue({
      user: createMockUser(),
      isAuthenticated: true,
    })

    ;(useBookings as jest.Mock).mockReturnValue({
      activeBooking: null,
    })

    render(<BookingInterface />)

    // Should still render the form without location
    expect(screen.getByLabelText(/pickup location/i)).toBeInTheDocument()
  })

  it('handles booking creation errors', async () => {
    const user = userEvent.setup()
    
    // Mock the mutation to return error
    const mockMutation = {
      mutateAsync: jest.fn().mockRejectedValue(new Error('Network error')),
      mutate: jest.fn(),
      isPending: false as const,
      isError: true as const,
      isSuccess: false as const,
      isIdle: false as const,
      isPaused: false as const,
      error: new Error('Network error'),
      data: undefined,
      variables: {} as Partial<Booking>,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
      reset: jest.fn(),
      status: 'error' as const,
    };
    
    // Mock the hook
    const useCreateBookingMutationSpy = jest.spyOn(queries, 'useCreateBookingMutation')
    useCreateBookingMutationSpy.mockReturnValue(mockMutation);

    ;(useAuth as jest.Mock).mockReturnValue({
      user: createMockUser(),
      isAuthenticated: true,
    })

    ;(useBookings as jest.Mock).mockReturnValue({
      activeBooking: null,
    })

    setupGeolocationMock()

    render(<BookingInterface />)

    // Fill out and submit the form
    const dropInput = screen.getByLabelText(/drop location/i)
    const vehicleSelect = screen.getByLabelText(/vehicle type/i)

    await user.type(dropInput, 'Airport')
    await user.click(vehicleSelect)
    
    const economyOption = screen.getByText(/economy car/i)
    await user.click(economyOption)

    await waitFor(() => {
      const bookButton = screen.getByRole('button', { name: /book ride now/i })
      expect(bookButton).not.toBeDisabled()
    })

    const bookButton = screen.getByRole('button', { name: /book ride now/i })
    await user.click(bookButton)

    await waitFor(() => {
      expect(createBookingMock).toHaveBeenCalled()
    })
  })
})