import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wallet/withdrawals - Get withdrawal methods for driver
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

        // Get driver profile
        const driver = await db.driver.findUnique({
            where: { userId },
            include: {
                withdrawalMethods: true
            }
        })

        if (!driver) {
            return NextResponse.json(
                { message: 'Driver profile not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            withdrawalMethods: driver.withdrawalMethods
        })

    } catch (error) {
        console.error('Get withdrawal methods error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/wallet/withdrawals - Add or update withdrawal method
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
            type,
            accountNumber,
            accountHolderName,
            bankName,
            ifscCode,
            upiId,
            paypalEmail,
            stripeAccountId,
            isDefault = false
        } = await request.json()

        if (!type) {
            return NextResponse.json(
                { message: 'Withdrawal method type is required' },
                { status: 400 }
            )
        }

        // Get driver profile
        const driver = await db.driver.findUnique({
            where: { userId }
        })

        if (!driver) {
            return NextResponse.json(
                { message: 'Driver profile not found' },
                { status: 404 }
            )
        }

        // Validate required fields based on type
        if (type === 'BANK_TRANSFER') {
            if (!accountNumber || !accountHolderName || !bankName || !ifscCode) {
                return NextResponse.json(
                    { message: 'Account number, holder name, bank name, and IFSC code are required for bank transfer' },
                    { status: 400 }
                )
            }
        } else if (type === 'UPI') {
            if (!upiId) {
                return NextResponse.json(
                    { message: 'UPI ID is required for UPI withdrawal' },
                    { status: 400 }
                )
            }
        } else if (type === 'PAYPAL') {
            if (!paypalEmail) {
                return NextResponse.json(
                    { message: 'PayPal email is required for PayPal withdrawal' },
                    { status: 400 }
                )
            }
        } else if (type === 'STRIPE') {
            if (!stripeAccountId) {
                return NextResponse.json(
                    { message: 'Stripe account ID is required for Stripe withdrawal' },
                    { status: 400 }
                )
            }
        }

        // Use transaction to ensure data consistency
        const result = await db.$transaction(async (prisma) => {
            // If setting as default, unset other defaults
            if (isDefault) {
                await prisma.withdrawalMethod.updateMany({
                    where: { driverId: driver.id },
                    data: { isDefault: false }
                })
            }

            // Create withdrawal method
            const withdrawalMethod = await prisma.withdrawalMethod.create({
                data: {
                    driverId: driver.id,
                    type,
                    accountNumber,
                    accountHolderName,
                    bankName,
                    ifscCode,
                    upiId,
                    paypalEmail,
                    stripeAccountId,
                    isDefault
                }
            })

            return withdrawalMethod
        })

        return NextResponse.json({
            success: true,
            withdrawalMethod: result,
            message: 'Withdrawal method added successfully'
        })

    } catch (error) {
        console.error('Add withdrawal method error:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to add withdrawal method',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}