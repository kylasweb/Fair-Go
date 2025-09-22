import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/v1/ai/models - Get all available AI models
export async function GET(request: NextRequest) {
    try {
        // Get base model and all fine-tuned models from completed jobs
        const [config, completedJobs] = await Promise.all([
            db.appConfig.findFirst({
                where: { key: 'active_ai_model_id' }
            }),
            db.aIFinetuneJob.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' }
            })
        ])

        const activeModelId = config?.value || 'base_model'

        const models = [
            {
                id: 'base_model',
                name: 'Base Puter.js Model',
                type: 'base',
                createdAt: '2024-01-01T00:00:00Z',
                isActive: activeModelId === 'base_model',
                metrics: {
                    accuracy: 0.85,
                    trainingExamples: 0
                }
            },
            ...completedJobs.map(job => ({
                id: job.resultingModelId || job.id,
                name: job.name,
                type: 'fine-tuned' as const,
                createdAt: job.completedAt?.toISOString(),
                isActive: activeModelId === (job.resultingModelId || job.id),
                parentJobId: job.id,
                metrics: {
                    accuracy: job.accuracy || null,
                    trainingExamples: job.sourceDatasetSize
                }
            }))
        ]

        return NextResponse.json({
            success: true,
            data: {
                models,
                activeModelId
            }
        })

    } catch (error) {
        console.error('Failed to fetch models:', error)
        return NextResponse.json({
            error: 'Failed to fetch models'
        }, { status: 500 })
    }
}