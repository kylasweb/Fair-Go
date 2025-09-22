import { cn } from '@/lib/utils'

describe('Basic Utility Test', () => {
    it('cn function works correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2')
    })
})