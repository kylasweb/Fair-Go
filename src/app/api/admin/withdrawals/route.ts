import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/withdrawals - Get all withdrawal requests
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

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // 'PENDING', 'APPROVED', 'REJECTED', or null for all
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build where conditions
        const whereConditions: any = {
            withdrawalMethodId: { not: null } // Only withdrawal transactions
        }

        if (status) {
            whereConditions.status = status
        }

        // Get withdrawal transactions with related data
        const [transactions, totalCount] = await Promise.all([
            db.walletTransaction.findMany({
                where: whereConditions,
                include: {
                    wallet: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    withdrawalMethod: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: offset
            }),
            db.walletTransaction.count({
                where: whereConditions
            })
        ])

        return NextResponse.json({
            transactions,
            totalCount,
            hasMore: offset + transactions.length < totalCount
        })

    } catch (error) {
        console.error('Get withdrawal requests error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/admin/withdrawals/:id/approve - Approve a withdrawal request
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

        const userId = tokenParts[1]

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { transactionId, action, rejectionReason } = await request.json()

        if (!transactionId || !action) {
            return NextResponse.json(
                { message: 'Transaction ID and action are required' },
                { status: 400 }
            )
        }

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { message: 'Invalid action. Must be APPROVE or REJECT' },
                { status: 400 }
            )
        }

        // Get the transaction
        const transaction = await db.walletTransaction.findUnique({
            where: { id: transactionId },
            include: {
                wallet: true,
                withdrawalMethod: true
            }
        })

        if (!transaction) {
            return NextResponse.json(
                { message: 'Transaction not found' },
                { status: 404 }
            )
        }

        if (transaction.status !== 'PENDING') {
            return NextResponse.json(
                { message: 'Transaction is not in pending status' },
                { status: 400 }
            )
        }

        // Use transaction to ensure data consistency
        const result = await db.$transaction(async (prisma) => {
            if (action === 'APPROVE') {
                // Update transaction status to COMPLETED
                await prisma.walletTransaction.update({
                    where: { id: transactionId },
                    data: {
                        status: 'COMPLETED',
                        processedAt: new Date()
                    }
                })

                // Note: Amount is already deducted from wallet when request was made
                // In a real implementation, you would integrate with payment processors here

                return {
                    success: true,
                    message: 'Withdrawal request approved successfully',
                    transaction: {
                        ...transaction,
                        status: 'COMPLETED',
                        processedAt: new Date()
                    }
                }

            } else if (action === 'REJECT') {
                // Update transaction status to FAILED
                await prisma.walletTransaction.update({
                    where: { id: transactionId },
                    data: {
                        status: 'FAILED',
                        processedAt: new Date(),
                        failureReason: rejectionReason || 'Request rejected by admin'
                    }
                })

                // Refund the amount back to wallet
                if (transaction.wallet) {
                    await prisma.wallet.update({
                        where: { id: transaction.wallet.id },
                        data: {
                            balance: {
                                increment: transaction.amount
                            }
                        }
                    })
                }

                return {
                    success: true,
                    message: 'Withdrawal request rejected and amount refunded',
                    transaction: {
                        ...transaction,
                        status: 'FAILED',
                        processedAt: new Date(),
                        failureReason: rejectionReason || 'Request rejected by admin'
                    }
                }
            }
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Process withdrawal request error:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to process withdrawal request',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}