import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/training/examples - Get all training examples with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const language = searchParams.get('language');
        const source = searchParams.get('source');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build where clause
        const where: any = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (language && language !== 'all') {
            where.language = language;
        }
        if (source && source !== 'all') {
            where.source = source;
        }

        // Get training examples with pagination
        const examples = await prisma.aITrainingExample.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Get total count for pagination
        const totalCount = await prisma.aITrainingExample.count({ where });

        // Transform the data
        const transformedExamples = examples.map(example => ({
            id: example.id,
            prompt: example.prompt,
            completion: example.completion,
            language: example.language,
            source: example.source,
            status: example.status,
            metadata: example.metadata ? JSON.parse(example.metadata) : null,
            confidence: example.confidence,
            createdBy: example.createdBy,
            createdByUser: example.creator,
            reviewedBy: example.reviewedBy,
            reviewedByUser: example.reviewer,
            reviewedAt: example.reviewedAt,
            createdAt: example.createdAt,
            updatedAt: example.updatedAt,
        }));

        return NextResponse.json({
            examples: transformedExamples,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });

    } catch (error) {
        console.error('Error fetching training examples:', error);
        return NextResponse.json(
            { error: 'Failed to fetch training examples' },
            { status: 500 }
        );
    }
}

// POST /api/admin/training/examples - Create new training example
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            completion,
            language = 'ml',
            source = 'MANUAL_CORRECTION',
            metadata,
            confidence,
            createdBy
        } = body;

        // Validate required fields
        if (!prompt || !completion || !createdBy) {
            return NextResponse.json(
                { error: 'Missing required fields: prompt, completion, createdBy' },
                { status: 400 }
            );
        }

        // Create the training example
        const example = await prisma.aITrainingExample.create({
            data: {
                prompt,
                completion,
                language,
                source,
                status: 'PENDING_REVIEW',
                metadata: metadata ? JSON.stringify(metadata) : null,
                confidence,
                createdBy,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'Training example created successfully',
            example: {
                ...example,
                metadata: example.metadata ? JSON.parse(example.metadata) : null,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating training example:', error);
        return NextResponse.json(
            { error: 'Failed to create training example' },
            { status: 500 }
        );
    }
}