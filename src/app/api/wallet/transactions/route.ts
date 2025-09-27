import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wallet/transactions - Get wallet transaction history
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
        const type = searchParams.get('type') // 'CREDIT', 'DEBIT', or null for all
        const status = searchParams.get('status') // 'PENDING', 'COMPLETED', 'FAILED', or null for all
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Get user's wallet
        const wallet = await db.wallet.findUnique({
            where: { userId }
        })

        if (!wallet) {
            return NextResponse.json(
                { message: 'Wallet not found' },
                { status: 404 }
            )
        }

        // Build where conditions
        const whereConditions: any = {
            walletId: wallet.id
        }

        if (type) {
            if (type === 'CREDIT') whereConditions.type = 'DEPOSIT'
            else if (type === 'DEBIT') whereConditions.type = 'WITHDRAWAL'
            else whereConditions.type = type
        }
        if (status) whereConditions.status = status
        if (startDate || endDate) {
            whereConditions.createdAt = {}
            if (startDate) whereConditions.createdAt.gte = new Date(startDate)
            if (endDate) whereConditions.createdAt.lte = new Date(endDate)
        }

        // TODO: Implement proper WalletTransaction model
        // For now, return empty transactions since walletTransaction model doesn't exist
        // const transactions: any[] = []
        // const totalCount = 0

        const [transactions, totalCount] = await Promise.all([
            db.walletTransaction.findMany({
                where: whereConditions,
                include: {
                    booking: {
                        select: {
                            id: true,
                            pickupLocation: true,
                            dropLocation: true,
                            status: true,
                            createdAt: true
                        }
                    }
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

        // Get transaction summary
        // const summary = {
        //     totalCredits: 0,
        //     totalDebits: 0,
        //     pendingTransactions: 0,
        //     completedTransactions: 0
        // }
        const summary = await db.walletTransaction.groupBy({
            by: ['type', 'status'],
            where: {
                walletId: wallet.id
            },
            _sum: {
                amount: true
            },
            _count: true
        })

        // Calculate totals
        const totalCredits = summary
            .filter(s => s.type === 'DEPOSIT' && s.status === 'COMPLETED')
            .reduce((sum, s) => sum + (s._sum?.amount || 0), 0)

        const totalDebits = summary
            .filter(s => s.type === 'WITHDRAWAL' && s.status === 'COMPLETED')
            .reduce((sum, s) => sum + (s._sum?.amount || 0), 0)

        const pendingTransactions = summary
            .filter(s => s.status === 'PENDING')
            .reduce((sum, s) => sum + (s._count || 0), 0)

        const completedTransactions = summary
            .filter(s => s.status === 'COMPLETED')
            .reduce((sum, s) => sum + (s._count || 0), 0)

        const transactionSummary = {
            totalCredits,
            totalDebits,
            pendingTransactions,
            completedTransactions
        }

        return NextResponse.json({
            transactions,
            summary: transactionSummary,
            totalCount,
            hasMore: offset + transactions.length < totalCount,
            walletBalance: wallet.balance
        })

    } catch (error) {
        console.error('Wallet transactions GET error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}