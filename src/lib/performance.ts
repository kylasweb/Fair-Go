/**
 * Performance Monitoring and Optimization Utilities
 * Tracks application performance metrics and optimizations
 */

import React from 'react'

// Performance metrics tracking
interface PerformanceMetric {
    name: string
    value: number
    timestamp: number
    category: 'render' | 'network' | 'memory' | 'user-interaction'
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = []
    private observers: PerformanceObserver[] = []

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeObservers()
        }
    }

    private initializeObservers() {
        try {
            // Observe navigation timing
            if ('PerformanceObserver' in window) {
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric(`navigation_${entry.name}`, entry.duration, 'network')
                    }
                })
                navObserver.observe({ entryTypes: ['navigation'] })
                this.observers.push(navObserver)

                // Observe resource timing
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric(`resource_${entry.name}`, entry.duration, 'network')
                    }
                })
                resourceObserver.observe({ entryTypes: ['resource'] })
                this.observers.push(resourceObserver)

                // Observe paint timing
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric(`paint_${entry.name}`, entry.startTime, 'render')
                    }
                })
                paintObserver.observe({ entryTypes: ['paint'] })
                this.observers.push(paintObserver)
            }
        } catch (error) {
            console.warn('Performance monitoring initialization failed:', error)
        }
    }

    recordMetric(name: string, value: number, category: PerformanceMetric['category']) {
        this.metrics.push({
            name,
            value,
            timestamp: Date.now(),
            category
        })

        // Keep only last 1000 metrics
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000)
        }
    }

    getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
        return category
            ? this.metrics.filter(m => m.category === category)
            : this.metrics
    }

    getAverageMetric(name: string, timeWindow = 300000): number {
        const cutoff = Date.now() - timeWindow
        const relevantMetrics = this.metrics.filter(
            m => m.name === name && m.timestamp > cutoff
        )

        if (relevantMetrics.length === 0) return 0

        return relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length
    }

    getPerformanceSummary() {
        const now = Date.now()
        const lastHour = now - 3600000

        const recentMetrics = this.metrics.filter(m => m.timestamp > lastHour)

        const summary = {
            totalMetrics: recentMetrics.length,
            categories: {} as Record<string, number>,
            slowestOperations: [] as Array<{ name: string; value: number }>,
            averageLoadTime: 0,
            memoryUsage: this.getMemoryUsage()
        }

        // Group by category
        recentMetrics.forEach(metric => {
            summary.categories[metric.category] = (summary.categories[metric.category] || 0) + 1
        })

        // Find slowest operations
        summary.slowestOperations = recentMetrics
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
            .map(m => ({ name: m.name, value: m.value }))

        // Calculate average load time
        const navigationMetrics = recentMetrics.filter(m => m.name.includes('navigation'))
        if (navigationMetrics.length > 0) {
            summary.averageLoadTime = navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length
        }

        return summary
    }

    public getMemoryUsage() {
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
            const memory = (window.performance as any).memory
            return {
                used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
            }
        }
        return null
    }

    destroy() {
        this.observers.forEach(observer => observer.disconnect())
        this.observers = []
        this.metrics = []
    }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// React component performance tracking
export const withPerformanceTracking = <P extends Record<string, any>>(
    WrappedComponent: React.ComponentType<P>,
    componentName: string
) => {
    const ComponentWithPerformanceTracking = (props: P) => {
        const renderStart = React.useRef(0)

        // Track render start
        renderStart.current = performance.now()

        // Track render completion
        React.useEffect(() => {
            const renderTime = performance.now() - renderStart.current
            performanceMonitor.recordMetric(
                `component_render_${componentName}`,
                renderTime,
                'render'
            )
        })

        return React.createElement(WrappedComponent, props)
    }

    return React.memo(ComponentWithPerformanceTracking)
}

// Hook for measuring operation performance
export const usePerformanceTimer = (operationName: string) => {
    const timerRef = React.useRef<number | null>(null)

    const start = React.useCallback(() => {
        timerRef.current = performance.now()
    }, [])

    const end = React.useCallback((category: PerformanceMetric['category'] = 'user-interaction') => {
        if (timerRef.current !== null) {
            const duration = performance.now() - timerRef.current
            performanceMonitor.recordMetric(operationName, duration, category)
            timerRef.current = null
            return duration
        }
        return 0
    }, [operationName])

    return { start, end }
}

// Bundle size analyzer
export const bundleAnalyzer = {
    getLoadedChunks: () => {
        if (typeof window === 'undefined') return []

        return Array.from(document.scripts)
            .map(script => ({
                src: script.src,
                async: script.async,
                defer: script.defer,
                type: script.type || 'text/javascript'
            }))
            .filter(script => script.src)
    },

    analyzeChunkLoading: () => {
        const scripts = bundleAnalyzer.getLoadedChunks()
        const analysis = {
            totalScripts: scripts.length,
            asyncScripts: scripts.filter(s => s.async).length,
            deferredScripts: scripts.filter(s => s.defer).length,
            moduleScripts: scripts.filter(s => s.type === 'module').length
        }

        return {
            ...analysis,
            recommendations: bundleAnalyzer.getRecommendations(analysis)
        }
    },

    getRecommendations: (analysis: any) => {
        const recommendations: string[] = []

        if (analysis.asyncScripts / analysis.totalScripts < 0.5) {
            recommendations.push('Consider making more scripts async to improve loading performance')
        }

        if (analysis.moduleScripts === 0) {
            recommendations.push('Consider using ES modules for better tree shaking')
        }

        return recommendations
    }
}

// Critical path optimization
export const criticalPathOptimizer = {
    identifyCriticalResources: () => {
        if (typeof window === 'undefined') return []

        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

        return resources
            .filter(resource => {
                // Identify critical resources (CSS, critical JS, fonts)
                return resource.name.includes('.css') ||
                    resource.name.includes('critical') ||
                    resource.name.includes('font')
            })
            .map(resource => ({
                name: resource.name,
                loadTime: resource.responseEnd - resource.requestStart,
                size: resource.transferSize || 0,
                cached: resource.transferSize === 0
            }))
            .sort((a, b) => b.loadTime - a.loadTime)
    },

    suggestOptimizations: () => {
        const criticalResources = criticalPathOptimizer.identifyCriticalResources()
        const suggestions: string[] = []

        criticalResources.forEach(resource => {
            if (resource.loadTime > 1000) {
                suggestions.push(`Optimize ${resource.name} - taking ${resource.loadTime.toFixed(2)}ms`)
            }

            if (resource.size > 100000 && !resource.cached) {
                suggestions.push(`Consider compressing ${resource.name} - ${(resource.size / 1024).toFixed(2)}KB`)
            }
        })

        return suggestions
    }
}

// React concurrent features optimizer
export const reactOptimizer = {
    // Check if concurrent features are being used effectively
    analyzeConcurrentFeatures: () => {
        const analysis = {
            suspenseBoundaries: document.querySelectorAll('[data-suspense]').length,
            lazyComponents: document.querySelectorAll('[data-lazy]').length,
            memosUsed: 0, // Would need React DevTools integration
            transitionsUsed: 0 // Would need React DevTools integration
        }

        const recommendations: string[] = []

        if (analysis.suspenseBoundaries === 0) {
            recommendations.push('Consider adding Suspense boundaries for better loading states')
        }

        if (analysis.lazyComponents < 5) {
            recommendations.push('Consider lazy loading more components to reduce initial bundle size')
        }

        return { analysis, recommendations }
    }
}

// Performance budget checker
export const performanceBudget = {
    budgets: {
        maxBundleSize: 250 * 1024, // 250KB
        maxLoadTime: 2000, // 2 seconds
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxRenderTime: 16 // 16ms for 60fps
    },

    checkBudgets: () => {
        const results = {
            bundleSize: { status: 'unknown', value: 0 },
            loadTime: { status: 'unknown', value: 0 },
            memoryUsage: { status: 'unknown', value: 0 },
            renderTime: { status: 'unknown', value: 0 }
        }

        // Check load time
        const loadTime = performanceMonitor.getAverageMetric('navigation_loadEventEnd')
        results.loadTime = {
            status: loadTime <= performanceBudget.budgets.maxLoadTime ? 'pass' : 'fail',
            value: loadTime
        }

        // Check memory usage
        const memory = performanceMonitor.getMemoryUsage()
        if (memory) {
            results.memoryUsage = {
                status: memory.used * 1024 * 1024 <= performanceBudget.budgets.maxMemoryUsage ? 'pass' : 'fail',
                value: memory.used
            }
        }

        return results
    }
}

// Export performance dashboard data
export const getPerformanceDashboard = () => ({
    summary: performanceMonitor.getPerformanceSummary(),
    bundleAnalysis: bundleAnalyzer.analyzeChunkLoading(),
    criticalPath: criticalPathOptimizer.suggestOptimizations(),
    concurrentFeatures: reactOptimizer.analyzeConcurrentFeatures(),
    budgetCheck: performanceBudget.checkBudgets()
})