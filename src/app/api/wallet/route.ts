import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Extract user ID from token
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]
    const { searchParams } = new URL(request.url)
    const includeTransactions = searchParams.get('includeTransactions') === 'true'
    const transactionLimit = parseInt(searchParams.get('transactionLimit') || '10')

    // Get user's wallet
    let wallet = await db.wallet.findUnique({
      where: { userId }
    })

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId }
      })
    }

    return NextResponse.json(wallet)

  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Extract user ID from token
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    const {
      action,
      amount,
      method,
      bookingId,
      description,
      paymentReference
    } = await request.json()

    if (!action || !amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Get or create wallet
    let wallet = await db.wallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'INR'
        }
      })
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (prisma) => {
      let updatedWallet
      let transaction

      if (action === 'add') {
        // Add funds to wallet
        const newBalance = wallet!.balance + amount

        updatedWallet = await prisma.wallet.update({
          where: { userId },
          data: {
            balance: newBalance
          }
        })

        // TODO: Create proper WalletTransaction model or use Payment model
        // Create transaction record
        transaction = await prisma.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            amount,
            type: 'DEPOSIT',
            description: description || `Added ₹${amount} to wallet`,
            paymentMethod: method || 'CARD',
            paymentReference,
            status: 'COMPLETED'
          }
        })

        return {
          success: true,
          wallet: updatedWallet,
          transaction,
          message: `Successfully added ₹${amount} to your wallet`
        }

      } else if (action === 'deduct') {
        // Deduct funds from wallet
        if (wallet!.balance < amount) {
          throw new Error('Insufficient wallet balance')
        }

        const newBalance = wallet!.balance - amount

        updatedWallet = await prisma.wallet.update({
          where: { userId },
          data: {
            balance: newBalance
          }
        })

        // TODO: Create proper WalletTransaction model or use Payment model
        // Create transaction record
        transaction = await prisma.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            amount,
            type: 'WITHDRAWAL',
            description: description || `Deducted ₹${amount} from wallet`,
            bookingId,
            status: 'COMPLETED'
          }
        })

        return {
          success: true,
          wallet: updatedWallet,
          transaction,
          message: `Successfully deducted ₹${amount} from your wallet`
        }

      } else {
        throw new Error('Invalid action')
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Wallet operation error:', error)

    if (error instanceof Error && error.message === 'Insufficient wallet balance') {
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient wallet balance'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process wallet operation',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}