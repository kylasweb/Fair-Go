import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for training data
const trainingDataSchema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty"),
    completion: z.string().min(1, "Completion cannot be empty"),
    language: z.string().optional().default("ml"),
    source: z.enum(["manual_correction", "bulk_upload", "api_submission"]).default("api_submission"),
    metadata: z.record(z.string(), z.any()).optional().default({})
})

const batchTrainingDataSchema = z.array(trainingDataSchema).max(1000, "Maximum 1000 examples per batch")

// POST /api/v1/ai/training-data
// Submit new training examples (single or batch)
export async function POST(request: NextRequest) {
    try {
        // Check admin authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)

        // Verify admin token
        const adminUser = await db.user.findFirst({
            where: {
                id: token.split('_')[1], // Extract user ID from token
                role: 'ADMIN'
            }
        })

        if (!adminUser) {
            return NextResponse.json(
                { error: 'Forbidden - Admin role required' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Handle both single and batch submissions
        const isBatch = Array.isArray(body)
        const validationSchema = isBatch ? batchTrainingDataSchema : trainingDataSchema

        const validatedData = isBatch
            ? validationSchema.parse(body)
            : [validationSchema.parse(body)]

        // Ensure validatedData is always an array
        const dataArray: any[] = Array.isArray(validatedData) ? validatedData : [validatedData]

        // Insert training examples
        const trainingExamples = await db.$transaction(
            dataArray.map((example: any) =>
                db.aITrainingExample.create({
                    data: {
                        prompt: example.prompt,
                        completion: example.completion,
                        language: example.language,
                        source: example.source,
                        status: example.source === 'bulk_upload' ? 'APPROVED' : 'PENDING_REVIEW',
                        metadata: example.metadata as any,
                        createdBy: adminUser.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })
            )
        )

        return NextResponse.json({
            success: true,
            message: `Successfully created ${trainingExamples.length} training example(s)`,
            data: {
                created_count: trainingExamples.length,
                examples: trainingExamples.map(ex => ({
                    id: ex.id,
                    status: ex.status,
                    language: ex.language
                }))
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Training data submission error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to submit training data',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// GET /api/v1/ai/training-data
// Retrieve training examples with filtering and pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status') as 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | null
        const language = searchParams.get('language')
        const source = searchParams.get('source') as 'MANUAL_CORRECTION' | 'BULK_UPLOAD' | 'API_SUBMISSION' | null

        const offset = (page - 1) * limit

        const where = {
            ...(status && { status }),
            ...(language && { language }),
            ...(source && { source })
        }

        const [examples, total] = await Promise.all([
            db.aITrainingExample.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
                include: {
                    creator: {
                        select: { name: true, email: true }
                    }
                }
            }),
            db.aITrainingExample.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: {
                examples,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error('Failed to fetch training data:', error)
        return NextResponse.json({
            error: 'Failed to fetch training data'
        }, { status: 500 })
    }
}