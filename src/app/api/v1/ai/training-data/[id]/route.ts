import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// GET /api/v1/ai/training-data/[id] - Get specific training example
// PUT /api/v1/ai/training-data/[id] - Update training example
// DELETE /api/v1/ai/training-data/[id] - Delete training example

const updateTrainingDataSchema = z.object({
    prompt: z.string().min(1).optional(),
    completion: z.string().min(1).optional(),
    status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
    metadata: z.record(z.string(), z.any()).optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        const example = await db.aITrainingExample.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        if (!example) {
            return NextResponse.json(
                { error: 'Training example not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: example
        })

    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch training example'
        }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()

        const validatedData = updateTrainingDataSchema.parse(body)

        const updated = await db.aITrainingExample.update({
            where: { id },
            data: {
                ...validatedData,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            data: updated
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to update training example'
        }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        await db.aITrainingExample.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Training example deleted successfully'
        })

    } catch (error) {
        return NextResponse.json({
            error: 'Failed to delete training example'
        }, { status: 500 })
    }
}