import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { useAuthStore } from '@/lib/store'
import { createMockUser } from '@/test-utils'

// Mock the store
jest.mock('@/lib/store')

// Test component to access auth context
const TestComponent = () => {
  const { user, signIn, signOut, isLoading } = useAuth()
  const isAuthenticated = !!user
  
  return (
    <div>
      <div data-testid="user-name">{user?.name || 'No user'}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <button onClick={() => signIn({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  const mockAuthStore = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    checkAuth: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStore)
  })

  it('provides auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-name')).toHaveTextContent('No user')
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
  })

  it('provides authenticated user information', () => {
    const mockUser = createMockUser()
    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      isAuthenticated: true,
    }

    ;(useAuthStore as unknown as jest.Mock).mockReturnValue(authenticatedStore)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-name')).toHaveTextContent(mockUser.name!)
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
  })

  it('shows loading state', () => {
    const loadingStore = {
      ...mockAuthStore,
      isLoading: true,
    }

    ;(useAuthStore as unknown as jest.Mock).mockReturnValue(loadingStore)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true')
  })

  it('calls login function from store', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    
    await act(async () => {
      loginButton.click()
    })

    expect(mockAuthStore.login).toHaveBeenCalledWith('test@example.com', 'password')
  })

  it('calls logout function from store', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const logoutButton = screen.getByText('Logout')
    
    await act(async () => {
      logoutButton.click()
    })

    expect(mockAuthStore.logout).toHaveBeenCalled()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const TestComponentOutsideProvider = () => {
      useAuth() // This should throw
      return <div>Should not render</div>
    }

    expect(() => {
      render(<TestComponentOutsideProvider />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('handles auth state changes', async () => {
    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially not authenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')

    // Simulate auth state change
    const authenticatedStore = {
      ...mockAuthStore,
      user: createMockUser(),
      isAuthenticated: true,
    }

    ;(useAuthStore as unknown as jest.Mock).mockReturnValue(authenticatedStore)

    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
  })

  it('initializes auth on mount', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(mockAuthStore.checkAuth).toHaveBeenCalled()
  })
})

// Test different auth scenarios
describe('AuthProvider Integration', () => {
  it('handles auth check failure gracefully', async () => {
    const failingAuthStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
      checkAuth: jest.fn().mockRejectedValue(new Error('Auth check failed')),
    }

    ;(useAuthStore as unknown as jest.Mock).mockReturnValue(failingAuthStore)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(failingAuthStore.checkAuth).toHaveBeenCalled()
    })

    // Should still render without crashing
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
  })

  it('provides all necessary auth methods', () => {
    let contextValue: any

    const TestComponent = () => {
      contextValue = useAuth()
      return <div>Test</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(contextValue).toHaveProperty('user')
    expect(contextValue).toHaveProperty('isLoading')
    expect(contextValue).toHaveProperty('signIn')
    expect(contextValue).toHaveProperty('signOut')
    expect(contextValue).toHaveProperty('signUp')
    expect(typeof contextValue.signIn).toBe('function')
    expect(typeof contextValue.signOut).toBe('function')
    expect(typeof contextValue.signUp).toBe('function')
  })
})