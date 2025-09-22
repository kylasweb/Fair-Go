import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

// GET /api/system/health - Comprehensive system health check
export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        const healthChecks = await Promise.allSettled([
            // Database health check
            checkDatabase(),

            // External services health
            checkExternalServices(),

            // System metrics
            getSystemMetrics(),

            // Application health
            checkApplicationHealth()
        ])

        const [dbHealth, externalHealth, systemMetrics, appHealth] = healthChecks.map(
            result => result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }
        )

        const overallStatus = determineOverallHealth([dbHealth, externalHealth, systemMetrics, appHealth])
        const responseTime = Date.now() - startTime

        const healthReport = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            checks: {
                database: dbHealth,
                external: externalHealth,
                system: systemMetrics,
                application: appHealth
            },
            uptime: process.uptime(),
            version: process.env.APP_VERSION || '1.0.0'
        }

        const statusCode = overallStatus === 'healthy' ? 200 : 503
        return NextResponse.json(healthReport, { status: statusCode })

    } catch (error) {
        console.error('Health check error:', error)
        return createErrorResponse('Health check failed', 500)
    }
}

async function checkDatabase() {
    try {
        const startTime = Date.now()

        // Test basic connectivity
        await db.$queryRaw`SELECT 1 as test`

        const queryTime = Date.now() - startTime

        // Check critical tables
        const [userCount, driverCount, bookingCount] = await Promise.all([
            db.user.count(),
            db.driver.count(),
            db.booking.count()
        ])

        return {
            status: 'healthy',
            responseTime: `${queryTime}ms`,
            connection: 'connected',
            stats: {
                users: userCount,
                drivers: driverCount,
                bookings: bookingCount
            }
        }
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Database connection failed'
        }
    }
}

async function checkExternalServices() {
    const services = [
        // Payment gateway health (mock)
        {
            name: 'Payment Gateway',
            check: async () => {
                // In real implementation, ping your payment service
                return { status: 'healthy', responseTime: '45ms' }
            }
        },

        // SMS service health (mock)
        {
            name: 'SMS Service',
            check: async () => {
                // In real implementation, ping your SMS provider
                return { status: 'healthy', responseTime: '23ms' }
            }
        },

        // Maps service health (mock)
        {
            name: 'Maps Service',
            check: async () => {
                // In real implementation, ping your maps provider
                return { status: 'healthy', responseTime: '67ms' }
            }
        }
    ]

    const results: Record<string, any> = {}

    for (const service of services) {
        try {
            results[service.name] = await service.check()
        } catch (error) {
            results[service.name] = {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Service check failed'
            }
        }
    }

    return results
}

async function getSystemMetrics() {
    try {
        const memoryUsage = process.memoryUsage()
        const cpuUsage = process.cpuUsage()

        return {
            status: 'healthy',
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: `${Math.round(process.uptime())}s`,
            nodeVersion: process.version,
            platform: process.platform
        }
    } catch (error) {
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to get system metrics'
        }
    }
}

async function checkApplicationHealth() {
    try {
        // Check critical application components
        const checks = {
            // Check if essential environment variables are set
            envVars: checkEnvironmentVariables(),

            // Check file system write access
            fileSystem: await checkFileSystemAccess(),

            // Check active connections/sessions
            activeConnections: await checkActiveConnections()
        }

        const isHealthy = Object.values(checks).every(check => check.status === 'healthy')

        return {
            status: isHealthy ? 'healthy' : 'degraded',
            checks
        }
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Application health check failed'
        }
    }
}

function checkEnvironmentVariables() {
    const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXT_PUBLIC_APP_URL'
    ]

    const missing = requiredVars.filter(varName => !process.env[varName])

    return {
        status: missing.length === 0 ? 'healthy' : 'unhealthy',
        required: requiredVars.length,
        missing: missing.length,
        ...(missing.length > 0 ? { missingVars: missing } : {})
    }
}

async function checkFileSystemAccess() {
    try {
        const { promises: fs } = await import('fs')
        const testFile = '/tmp/health-check-test'

        await fs.writeFile(testFile, 'test')
        await fs.unlink(testFile)

        return {
            status: 'healthy',
            writable: true
        }
    } catch (error) {
        return {
            status: 'degraded',
            writable: false,
            error: 'File system write access failed'
        }
    }
}

async function checkActiveConnections() {
    try {
        // Get recent activity metrics
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

        const [recentBookings, recentUsers] = await Promise.all([
            db.booking.count({
                where: {
                    createdAt: {
                        gte: fiveMinutesAgo
                    }
                }
            }),
            db.user.count({
                where: {
                    updatedAt: {
                        gte: fiveMinutesAgo
                    }
                }
            })
        ])

        return {
            status: 'healthy',
            recentBookings,
            recentActiveUsers: recentUsers
        }
    } catch (error) {
        return {
            status: 'error',
            error: 'Failed to check active connections'
        }
    }
}

function determineOverallHealth(checks: any[]): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = checks.map(check => check.status).filter(Boolean)

    if (statuses.includes('unhealthy') || statuses.includes('error')) {
        return 'unhealthy'
    }

    if (statuses.includes('degraded')) {
        return 'degraded'
    }

    return 'healthy'
}