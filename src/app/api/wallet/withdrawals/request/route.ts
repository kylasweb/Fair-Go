import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/wallet/withdrawals/request - Request a withdrawal
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

        const {
            amount,
            withdrawalMethodId,
            description
        } = await request.json()

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { message: 'Valid withdrawal amount is required' },
                { status: 400 }
            )
        }

        if (!withdrawalMethodId) {
            return NextResponse.json(
                { message: 'Withdrawal method ID is required' },
                { status: 400 }
            )
        }

        // Get driver profile and wallet
        const driver = await db.driver.findUnique({
            where: { userId },
            include: {
                withdrawalMethods: {
                    where: { id: withdrawalMethodId }
                }
            }
        })

        if (!driver) {
            return NextResponse.json(
                { message: 'Driver profile not found' },
                { status: 404 }
            )
        }

        if (driver.withdrawalMethods.length === 0) {
            return NextResponse.json(
                { message: 'Invalid withdrawal method' },
                { status: 400 }
            )
        }

        const withdrawalMethod = driver.withdrawalMethods[0]

        // Get driver's wallet
        const wallet = await db.wallet.findUnique({
            where: { userId }
        })

        if (!wallet) {
            return NextResponse.json(
                { message: 'Wallet not found' },
                { status: 404 }
            )
        }

        // Check if driver has sufficient balance
        if (wallet.balance < amount) {
            return NextResponse.json(
                { message: 'Insufficient wallet balance' },
                { status: 400 }
            )
        }

        // Check minimum withdrawal amount (₹100)
        if (amount < 100) {
            return NextResponse.json(
                { message: 'Minimum withdrawal amount is ₹100' },
                { status: 400 }
            )
        }

        // Use transaction to ensure data consistency
        const result = await db.$transaction(async (prisma) => {
            // Create withdrawal transaction
            const transaction = await prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: 'WITHDRAWAL',
                    description: description || `Withdrawal request of ₹${amount}`,
                    withdrawalMethodId,
                    status: 'PENDING'
                }
            })

            // Deduct amount from wallet (will be held until approved)
            const newBalance = wallet.balance - amount
            await prisma.wallet.update({
                where: { userId },
                data: { balance: newBalance }
            })

            return transaction
        })

        return NextResponse.json({
            success: true,
            transaction: result,
            message: 'Withdrawal request submitted successfully. Amount will be processed after admin approval.'
        })

    } catch (error) {
        console.error('Withdrawal request error:', error)
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