import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/training/jobs - Get all fine-tuning jobs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Build where clause
        const where: any = {};
        if (status && status !== 'all') {
            where.status = status;
        }

        // Get fine-tuning jobs with pagination
        const jobs = await prisma.aIFinetuneJob.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Get total count for pagination
        const totalCount = await prisma.aIFinetuneJob.count({ where });

        // Transform the data
        const transformedJobs = jobs.map(job => ({
            id: job.id,
            name: job.name,
            description: job.description,
            status: job.status,
            sourceDatasetSize: job.sourceDatasetSize,
            datasetFilters: job.datasetFilters ? JSON.parse(job.datasetFilters) : null,
            externalJobId: job.externalJobId,
            resultingModelId: job.resultingModelId,
            accuracy: job.accuracy,
            error: job.error,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        }));

        return NextResponse.json({
            jobs: transformedJobs,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });

    } catch (error) {
        console.error('Error fetching fine-tuning jobs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fine-tuning jobs' },
            { status: 500 }
        );
    }
}

// POST /api/admin/training/jobs - Create new fine-tuning job
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            description,
            languages = ['ml'],
            approvedOnly = true,
            statusFilter = ['APPROVED']
        } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Job name is required' },
                { status: 400 }
            );
        }

        // Build dataset filters
        const datasetFilters = {
            languages,
            status: approvedOnly ? statusFilter : undefined,
        };

        // Count the dataset size
        const whereClause: any = {};
        if (approvedOnly) {
            whereClause.status = { in: statusFilter };
        }
        if (languages.length > 0) {
            whereClause.language = { in: languages };
        }

        const datasetSize = await prisma.aITrainingExample.count({
            where: whereClause
        });

        if (datasetSize === 0) {
            return NextResponse.json(
                { error: 'No training examples found matching the specified criteria' },
                { status: 400 }
            );
        }

        // Create the fine-tuning job
        const job = await prisma.aIFinetuneJob.create({
            data: {
                name,
                description,
                status: 'PREPARING',
                sourceDatasetSize: datasetSize,
                datasetFilters: JSON.stringify(datasetFilters),
            }
        });

        // Start the fine-tuning process asynchronously
        startFinetuningProcess(job.id, whereClause);

        return NextResponse.json({
            message: 'Fine-tuning job created successfully',
            job: {
                ...job,
                datasetFilters: JSON.parse(job.datasetFilters || '{}'),
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating fine-tuning job:', error);
        return NextResponse.json(
            { error: 'Failed to create fine-tuning job' },
            { status: 500 }
        );
    }
}

// Background function to handle fine-tuning process
async function startFinetuningProcess(jobId: string, whereClause: any) {
    try {
        // Update job status to RUNNING
        await prisma.aIFinetuneJob.update({
            where: { id: jobId },
            data: {
                status: 'RUNNING',
                startedAt: new Date(),
            }
        });

        // Get training data
        const trainingExamples = await prisma.aITrainingExample.findMany({
            where: whereClause,
            select: {
                prompt: true,
                completion: true,
                language: true,
            }
        });

        // Format training data for Puter.js
        const trainingData = trainingExamples.map(example => ({
            prompt: example.prompt,
            completion: example.completion,
            metadata: {
                language: example.language,
            }
        }));

        // Call Puter.js fine-tuning API
        const puterResponse = await fetch(`${process.env.PUTER_MODEL_BASE_URL}/fine-tune`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'base_model',
                training_data: trainingData,
                job_name: jobId,
                hyperparameters: {
                    learning_rate: 0.0001,
                    epochs: 3,
                    batch_size: 16,
                }
            })
        });

        if (!puterResponse.ok) {
            throw new Error(`Puter.js API error: ${puterResponse.statusText}`);
        }

        const puterResult = await puterResponse.json();

        // Update job with external job ID
        await prisma.aIFinetuneJob.update({
            where: { id: jobId },
            data: {
                externalJobId: puterResult.job_id,
            }
        });

        // Monitor the job status
        monitorFinetuningJob(jobId, puterResult.job_id);

    } catch (error) {
        console.error('Error in fine-tuning process:', error);

        // Update job status to FAILED
        await prisma.aIFinetuneJob.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                completedAt: new Date(),
            }
        });
    }
}

// Function to monitor fine-tuning job progress
async function monitorFinetuningJob(jobId: string, externalJobId: string) {
    const maxAttempts = 100; // Maximum polling attempts
    let attempts = 0;

    const checkJobStatus = async () => {
        try {
            attempts++;

            // Check job status with Puter.js
            const statusResponse = await fetch(
                `${process.env.PUTER_MODEL_BASE_URL}/fine-tune/${externalJobId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.PUTER_API_KEY}`,
                    }
                }
            );

            if (!statusResponse.ok) {
                throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
            }

            const jobStatus = await statusResponse.json();

            if (jobStatus.status === 'completed') {
                // Job completed successfully
                await prisma.aIFinetuneJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'COMPLETED',
                        resultingModelId: jobStatus.model_id,
                        accuracy: jobStatus.accuracy || null,
                        completedAt: new Date(),
                    }
                });
                return;
            } else if (jobStatus.status === 'failed') {
                // Job failed
                await prisma.aIFinetuneJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'FAILED',
                        error: jobStatus.error || 'Fine-tuning failed',
                        completedAt: new Date(),
                    }
                });
                return;
            } else if (attempts >= maxAttempts) {
                // Timeout
                await prisma.aIFinetuneJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'FAILED',
                        error: 'Fine-tuning job timed out',
                        completedAt: new Date(),
                    }
                });
                return;
            }

            // Job still in progress, check again in 30 seconds
            setTimeout(checkJobStatus, 30000);

        } catch (error) {
            console.error('Error monitoring fine-tuning job:', error);

            if (attempts >= 5) {
                // Give up after 5 failed attempts
                await prisma.aIFinetuneJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'FAILED',
                        error: error instanceof Error ? error.message : 'Failed to monitor job',
                        completedAt: new Date(),
                    }
                });
            } else {
                // Retry in 1 minute
                setTimeout(checkJobStatus, 60000);
            }
        }
    };

    // Start monitoring
    setTimeout(checkJobStatus, 30000); // Check after 30 seconds
}