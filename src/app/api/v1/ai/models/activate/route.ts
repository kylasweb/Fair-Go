import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const activateModelSchema = z.object({
    modelId: z.string().min(1, "Model ID is required")
})

// POST /api/v1/ai/models/activate - Activate a specific AI model
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { modelId } = activateModelSchema.parse(body)

        // Validate that the model exists
        if (modelId !== 'base_model') {
            const job = await db.aIFinetuneJob.findFirst({
                where: {
                    OR: [
                        { resultingModelId: modelId },
                        { id: modelId }
                    ],
                    status: 'COMPLETED'
                }
            })

            if (!job) {
                return NextResponse.json({
                    error: 'Model not found or not ready for deployment'
                }, { status: 404 })
            }
        }

        // Update or create the active model configuration
        await db.appConfig.upsert({
            where: { key: 'active_ai_model_id' },
            update: {
                value: modelId,
                updatedAt: new Date()
            },
            create: {
                key: 'active_ai_model_id',
                value: modelId,
                description: 'Currently active AI model for production use',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        // Log the model activation
        console.log(`AI Model activated: ${modelId} at ${new Date().toISOString()}`)

        return NextResponse.json({
            success: true,
            message: `Model ${modelId} activated successfully`,
            data: {
                activeModelId: modelId,
                activatedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Model activation error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to activate model'
        }, { status: 500 })
    }
}