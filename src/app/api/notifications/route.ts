import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const userId = tokenParts[1]
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const notifications = await db.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { isRead: false } : {})
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        })

        // Get unread count
        const unreadCount = await db.notification.count({
            where: {
                userId,
                isRead: false
            }
        })

        return NextResponse.json({
            notifications,
            unreadCount,
            hasMore: notifications.length === limit
        })

    } catch (error) {
        console.error('Notifications GET error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/notifications - Create notification (admin/system use)
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const senderId = tokenParts[1]

        // Check if sender is admin
        const sender = await db.user.findUnique({
            where: { id: senderId }
        })

        if (!sender || sender.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Insufficient permissions' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            userId,
            title,
            message,
            type = 'INFO',
            category = 'GENERAL',
            data = null,
            scheduledFor = null
        } = body

        if (!userId || !title || !message) {
            return NextResponse.json(
                { message: 'User ID, title, and message are required' },
                { status: 400 }
            )
        }

        const notification = await db.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                category,
                data,
                isRead: false
            }
        })

        return NextResponse.json(notification, { status: 201 })

    } catch (error) {
        console.error('Notifications POST error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/notifications - Update notification (mark as read/unread)
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const userId = tokenParts[1]
        const body = await request.json()
        const { notificationId, notificationIds, isRead, action } = body

        if (action === 'markAllAsRead') {
            // Mark all notifications as read for user
            const result = await db.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            })

            return NextResponse.json({
                message: 'All notifications marked as read',
                updatedCount: result.count
            })
        }

        if (notificationIds && Array.isArray(notificationIds)) {
            // Bulk update multiple notifications
            const result = await db.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId
                },
                data: {
                    isRead: isRead ?? true,
                    readAt: isRead !== false ? new Date() : null
                }
            })

            return NextResponse.json({
                message: 'Notifications updated',
                updatedCount: result.count
            })
        }

        if (notificationId) {
            // Update single notification
            const notification = await db.notification.findFirst({
                where: {
                    id: notificationId,
                    userId
                }
            })

            if (!notification) {
                return NextResponse.json(
                    { message: 'Notification not found' },
                    { status: 404 }
                )
            }

            const updatedNotification = await db.notification.update({
                where: { id: notificationId },
                data: {
                    isRead: isRead ?? true,
                    readAt: isRead !== false ? new Date() : null
                }
            })

            return NextResponse.json(updatedNotification)
        }

        return NextResponse.json(
            { message: 'Notification ID or action is required' },
            { status: 400 }
        )

    } catch (error) {
        console.error('Notifications PATCH error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const userId = tokenParts[1]
        const { searchParams } = new URL(request.url)
        const notificationId = searchParams.get('id')
        const action = searchParams.get('action')

        if (action === 'deleteAll') {
            // Delete all notifications for user (older than 30 days)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const result = await db.notification.deleteMany({
                where: {
                    userId,
                    createdAt: {
                        lt: thirtyDaysAgo
                    }
                }
            })

            return NextResponse.json({
                message: 'Old notifications deleted',
                deletedCount: result.count
            })
        }

        if (!notificationId) {
            return NextResponse.json(
                { message: 'Notification ID is required' },
                { status: 400 }
            )
        }

        // Check if notification belongs to user
        const notification = await db.notification.findFirst({
            where: {
                id: notificationId,
                userId
            }
        })

        if (!notification) {
            return NextResponse.json(
                { message: 'Notification not found' },
                { status: 404 }
            )
        }

        await db.notification.delete({
            where: { id: notificationId }
        })

        return NextResponse.json({
            message: 'Notification deleted successfully'
        })

    } catch (error) {
        console.error('Notifications DELETE error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}