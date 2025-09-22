import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Fine-tuning job management endpoints
const createFinetuneJobSchema = z.object({
    name: z.string().min(1, "Job name is required"),
    description: z.string().optional(),
    datasetFilters: z.object({
        status: z.enum(['APPROVED']).default('APPROVED'),
        language: z.string().optional(),
        minConfidence: z.number().min(0).max(1).optional(),
        dateRange: z.object({
            from: z.string().datetime().optional(),
            to: z.string().datetime().optional()
        }).optional()
    }).optional()
})

// POST /api/v1/ai/finetune-jobs - Create new fine-tuning job
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = createFinetuneJobSchema.parse(body)

        // Get approved training examples based on filters
        const where = {
            status: 'APPROVED' as const,
            ...(validatedData.datasetFilters?.language && {
                language: validatedData.datasetFilters.language
            }),
            ...(validatedData.datasetFilters?.dateRange && {
                createdAt: {
                    ...(validatedData.datasetFilters.dateRange.from && {
                        gte: new Date(validatedData.datasetFilters.dateRange.from)
                    }),
                    ...(validatedData.datasetFilters.dateRange.to && {
                        lte: new Date(validatedData.datasetFilters.dateRange.to)
                    })
                }
            })
        }

        const trainingExamples = await db.aITrainingExample.findMany({
            where,
            select: {
                prompt: true,
                completion: true,
                language: true
            }
        })

        if (trainingExamples.length === 0) {
            return NextResponse.json({
                error: 'No approved training examples found with the specified filters'
            }, { status: 400 })
        }

        // Create fine-tuning job record
        const job = await db.aIFinetuneJob.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                status: 'PREPARING',
                sourceDatasetSize: trainingExamples.length,
                datasetFilters: validatedData.datasetFilters as any,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        // Format data for Puter.js fine-tuning API
        const formattedDataset = trainingExamples.map(example => ({
            prompt: example.prompt,
            completion: example.completion,
            language: example.language
        }))

        // Start fine-tuning process (async)
        startFinetuningProcess(job.id, formattedDataset)

        return NextResponse.json({
            success: true,
            message: 'Fine-tuning job created successfully',
            data: {
                jobId: job.id,
                status: job.status,
                datasetSize: job.sourceDatasetSize
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Fine-tuning job creation error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to create fine-tuning job'
        }, { status: 500 })
    }
}

// GET /api/v1/ai/finetune-jobs - List all fine-tuning jobs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') as 'PREPARING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | null
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where = status ? { status } : {}
        const offset = (page - 1) * limit

        const [jobs, total] = await Promise.all([
            db.aIFinetuneJob.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            db.aIFinetuneJob.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: {
                jobs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch fine-tuning jobs'
        }, { status: 500 })
    }
}

// Async function to handle fine-tuning process
async function startFinetuningProcess(jobId: string, dataset: any[]) {
    try {
        // Update job status
        await db.aIFinetuneJob.update({
            where: { id: jobId },
            data: {
                status: 'RUNNING',
                startedAt: new Date(),
                updatedAt: new Date()
            }
        })

        // TODO: Integrate with Puter.js fine-tuning API
        // This would typically involve:
        // 1. Upload dataset to Puter.js
        // 2. Start fine-tuning job
        // 3. Store external job ID
        // 4. Set up polling for status updates

        // Mock implementation for now
        setTimeout(async () => {
            const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            await db.aIFinetuneJob.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    resultingModelId: modelId,
                    completedAt: new Date(),
                    updatedAt: new Date()
                }
            })
        }, 30000) // 30 seconds mock training time

    } catch (error) {
        console.error('Fine-tuning process error:', error)

        await db.aIFinetuneJob.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
                updatedAt: new Date()
            }
        })
    }
}