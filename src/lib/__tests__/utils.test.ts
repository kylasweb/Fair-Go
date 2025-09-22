import {
    cn,
    formatCurrency,
    calculateDistance,
    generateEstimatedFare,
    validateEmail,
    validatePhone,
    formatTimeAgo,
    generateBookingId,
    slugify
} from '@/lib/utils'

describe('Utility Functions', () => {
    describe('cn (className utility)', () => {
        it('merges class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2')
        })

        it('handles conditional classes', () => {
            expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
        })

        it('handles undefined and null values', () => {
            expect(cn('base', undefined, null, 'valid')).toBe('base valid')
        })

        it('handles Tailwind class conflicts', () => {
            // This tests clsx + tailwind-merge functionality
            const result = cn('px-2', 'px-4', 'py-1')
            expect(result).toBe('px-4 py-1') // px-4 should override px-2
        })
    })

    describe('formatCurrency', () => {
        it('formats Indian currency correctly', () => {
            expect(formatCurrency(100)).toBe('₹100')
            expect(formatCurrency(1000)).toBe('₹1,000')
            expect(formatCurrency(1000000)).toBe('₹10,00,000')
        })

        it('handles decimal values', () => {
            expect(formatCurrency(99.99)).toBe('₹99.99')
            expect(formatCurrency(1500.50)).toBe('₹1,500.50')
        })

        it('handles zero and negative values', () => {
            expect(formatCurrency(0)).toBe('₹0')
            expect(formatCurrency(-100)).toBe('-₹100')
        })

        it('supports different currencies', () => {
            expect(formatCurrency(100, 'USD')).toBe('$100')
            expect(formatCurrency(100, 'EUR')).toBe('€100')
        })
    })

    describe('calculateDistance', () => {
        it('calculates distance between two coordinates', () => {
            // Distance between Kochi and Ernakulam (approximate)
            const point1 = { lat: 9.9312, lng: 76.2673 }
            const point2 = { lat: 9.9816, lng: 76.2999 }

            const distance = calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng)
            expect(distance).toBeGreaterThan(0)
            expect(distance).toBeLessThan(10) // Should be less than 10km
        })

        it('returns 0 for same coordinates', () => {
            const distance = calculateDistance(9.9312, 76.2673, 9.9312, 76.2673)
            expect(distance).toBe(0)
        })

        it('calculates long distances correctly', () => {
            // Distance between Kochi and Mumbai
            const kochiLat = 9.9312, kochiLng = 76.2673
            const mumbaiLat = 19.0760, mumbaiLng = 72.8777

            const distance = calculateDistance(kochiLat, kochiLng, mumbaiLat, mumbaiLng)
            expect(distance).toBeGreaterThan(1000) // Should be more than 1000km
        })
    })

    describe('generateEstimatedFare', () => {
        it('calculates fare for different vehicle types', () => {
            const distance = 10 // 10 km

            const economyFare = generateEstimatedFare(distance, 'CAR_ECONOMY')
            const premiumFare = generateEstimatedFare(distance, 'CAR_PREMIUM')
            const autoFare = generateEstimatedFare(distance, 'AUTO')

            expect(premiumFare).toBeGreaterThan(economyFare)
            expect(economyFare).toBeGreaterThan(autoFare)
        })

        it('includes base fare in calculation', () => {
            const shortDistance = 1
            const fare = generateEstimatedFare(shortDistance, 'CAR_ECONOMY')

            // Should have base fare even for short distances
            expect(fare).toBeGreaterThan(20) // Assuming base fare is around 20
        })

        it('handles zero distance', () => {
            const fare = generateEstimatedFare(0, 'CAR_ECONOMY')
            expect(fare).toBeGreaterThan(0) // Should still have base fare
        })

        it('applies surge pricing when specified', () => {
            const distance = 10
            const normalFare = generateEstimatedFare(distance, 'CAR_ECONOMY', 1.0)
            const surgeFare = generateEstimatedFare(distance, 'CAR_ECONOMY', 1.5)

            expect(surgeFare).toBe(normalFare * 1.5)
        })
    })

    describe('validateEmail', () => {
        it('validates correct email formats', () => {
            expect(validateEmail('user@fairgo.com')).toBe(true)
            expect(validateEmail('test.email@gmail.com')).toBe(true)
            expect(validateEmail('user+tag@domain.co.in')).toBe(true)
        })

        it('rejects invalid email formats', () => {
            expect(validateEmail('invalid-email')).toBe(false)
            expect(validateEmail('user@')).toBe(false)
            expect(validateEmail('@domain.com')).toBe(false)
            expect(validateEmail('user..double@domain.com')).toBe(false)
        })

        it('handles edge cases', () => {
            expect(validateEmail('')).toBe(false)
            expect(validateEmail(' ')).toBe(false)
            expect(validateEmail(null as any)).toBe(false)
            expect(validateEmail(undefined as any)).toBe(false)
        })
    })

    describe('validatePhone', () => {
        it('validates Indian phone numbers', () => {
            expect(validatePhone('9876543210')).toBe(true)
            expect(validatePhone('+919876543210')).toBe(true)
            expect(validatePhone('919876543210')).toBe(true)
        })

        it('rejects invalid phone numbers', () => {
            expect(validatePhone('123456789')).toBe(false) // Too short
            expect(validatePhone('12345678901')).toBe(false) // Too long
            expect(validatePhone('abcdefghij')).toBe(false) // Non-numeric
        })

        it('handles different formats', () => {
            expect(validatePhone('98765-43210')).toBe(true)
            expect(validatePhone('9876 543 210')).toBe(true)
            expect(validatePhone('(987) 654-3210')).toBe(true)
        })
    })

    describe('formatTimeAgo', () => {
        const now = new Date()

        it('formats recent times correctly', () => {
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
            expect(formatTimeAgo(fiveMinutesAgo)).toBe('5 minutes ago')

            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
            expect(formatTimeAgo(oneMinuteAgo)).toBe('1 minute ago')
        })

        it('formats hours correctly', () => {
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
            expect(formatTimeAgo(twoHoursAgo)).toBe('2 hours ago')
        })

        it('formats days correctly', () => {
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
            expect(formatTimeAgo(threeDaysAgo)).toBe('3 days ago')
        })

        it('handles very recent times', () => {
            const justNow = new Date(now.getTime() - 30 * 1000)
            expect(formatTimeAgo(justNow)).toBe('just now')
        })

        it('handles future dates', () => {
            const future = new Date(now.getTime() + 60 * 60 * 1000)
            expect(formatTimeAgo(future)).toBe('just now') // Should not show future
        })
    })

    describe('generateBookingId', () => {
        it('generates unique booking IDs', () => {
            const id1 = generateBookingId()
            const id2 = generateBookingId()

            expect(id1).toBeDefined()
            expect(id2).toBeDefined()
            expect(id1).not.toBe(id2)
        })

        it('follows expected format', () => {
            const bookingId = generateBookingId()

            // Should start with FG (FairGo)
            expect(bookingId).toMatch(/^FG/)

            // Should have expected length
            expect(bookingId.length).toBeGreaterThan(8)
        })

        it('generates multiple unique IDs', () => {
            const ids = Array.from({ length: 100 }, () => generateBookingId())
            const uniqueIds = new Set(ids)

            expect(uniqueIds.size).toBe(100) // All should be unique
        })
    })

    describe('slugify', () => {
        it('converts strings to URL-friendly slugs', () => {
            expect(slugify('Hello World')).toBe('hello-world')
            expect(slugify('Driver Registration Form')).toBe('driver-registration-form')
        })

        it('handles special characters', () => {
            expect(slugify('User@Domain.com')).toBe('user-domain-com')
            expect(slugify('Price: $100 & Tax')).toBe('price-100-tax')
        })

        it('handles multiple spaces', () => {
            expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here')
        })

        it('removes leading and trailing hyphens', () => {
            expect(slugify(' -Start and End- ')).toBe('start-and-end')
        })

        it('handles non-English characters', () => {
            expect(slugify('Café & Résumé')).toBe('caf-rsum')
        })

        it('handles numbers correctly', () => {
            expect(slugify('Version 2.0 Release Notes')).toBe('version-2-0-release-notes')
        })
    })
})

describe('Date and Time Utilities', () => {
    describe('formatTimeAgo edge cases', () => {
        beforeAll(() => {
            // Mock current time to ensure consistent tests
            jest.spyOn(Date, 'now').mockImplementation(() =>
                new Date('2023-12-01T12:00:00Z').getTime()
            )
        })

        afterAll(() => {
            jest.restoreAllMocks()
        })

        it('handles seconds correctly', () => {
            const date = new Date('2023-12-01T11:59:30Z')
            expect(formatTimeAgo(date)).toBe('just now')
        })

        it('handles exact minute boundary', () => {
            const date = new Date('2023-12-01T11:59:00Z')
            expect(formatTimeAgo(date)).toBe('1 minute ago')
        })

        it('handles exact hour boundary', () => {
            const date = new Date('2023-12-01T11:00:00Z')
            expect(formatTimeAgo(date)).toBe('1 hour ago')
        })

        it('handles exact day boundary', () => {
            const date = new Date('2023-11-30T12:00:00Z')
            expect(formatTimeAgo(date)).toBe('1 day ago')
        })

        it('handles week boundaries', () => {
            const date = new Date('2023-11-17T12:00:00Z') // 2 weeks ago
            expect(formatTimeAgo(date)).toBe('14 days ago')
        })
    })
})

describe('Currency and Number Utilities', () => {
    describe('formatCurrency with locale support', () => {
        it('formats with Indian number system', () => {
            expect(formatCurrency(12345.67)).toBe('₹12,345.67')
            expect(formatCurrency(1234567.89)).toBe('₹12,34,567.89')
        })

        it('handles very large numbers', () => {
            expect(formatCurrency(10000000)).toBe('₹1,00,00,000')
        })

        it('handles very small numbers', () => {
            expect(formatCurrency(0.01)).toBe('₹0.01')
            expect(formatCurrency(0.99)).toBe('₹0.99')
        })
    })
})