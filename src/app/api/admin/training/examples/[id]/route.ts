import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/training/examples/[id] - Get specific training example
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const example = await prisma.aITrainingExample.findUnique({
            where: { id },
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
            }
        });

        if (!example) {
            return NextResponse.json(
                { error: 'Training example not found' },
                { status: 404 }
            );
        }

        // Transform the data
        const transformedExample = {
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
        };

        return NextResponse.json(transformedExample);

    } catch (error) {
        console.error('Error fetching training example:', error);
        return NextResponse.json(
            { error: 'Failed to fetch training example' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/training/examples/[id] - Update training example status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { status, reviewedBy, feedback } = body;

        // Validate status
        const validStatuses = ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
                { status: 400 }
            );
        }

        // Check if example exists
        const existingExample = await prisma.aITrainingExample.findUnique({
            where: { id }
        });

        if (!existingExample) {
            return NextResponse.json(
                { error: 'Training example not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};

        if (status) {
            updateData.status = status;
        }

        if (reviewedBy) {
            updateData.reviewedBy = reviewedBy;
            updateData.reviewedAt = new Date();
        }

        if (feedback) {
            // Add feedback to metadata
            const currentMetadata = existingExample.metadata ?
                JSON.parse(existingExample.metadata) : {};
            updateData.metadata = JSON.stringify({
                ...currentMetadata,
                reviewFeedback: feedback,
                reviewedAt: new Date().toISOString()
            });
        }

        // Update the example
        const updatedExample = await prisma.aITrainingExample.update({
            where: { id },
            data: updateData,
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
            }
        });

        // Transform the response
        const transformedExample = {
            id: updatedExample.id,
            prompt: updatedExample.prompt,
            completion: updatedExample.completion,
            language: updatedExample.language,
            source: updatedExample.source,
            status: updatedExample.status,
            metadata: updatedExample.metadata ? JSON.parse(updatedExample.metadata) : null,
            confidence: updatedExample.confidence,
            createdBy: updatedExample.createdBy,
            createdByUser: updatedExample.creator,
            reviewedBy: updatedExample.reviewedBy,
            reviewedByUser: updatedExample.reviewer,
            reviewedAt: updatedExample.reviewedAt,
            createdAt: updatedExample.createdAt,
            updatedAt: updatedExample.updatedAt,
        };

        return NextResponse.json({
            message: 'Training example updated successfully',
            example: transformedExample
        });

    } catch (error) {
        console.error('Error updating training example:', error);
        return NextResponse.json(
            { error: 'Failed to update training example' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/training/examples/[id] - Delete training example
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if example exists
        const existingExample = await prisma.aITrainingExample.findUnique({
            where: { id }
        });

        if (!existingExample) {
            return NextResponse.json(
                { error: 'Training example not found' },
                { status: 404 }
            );
        }

        // Delete the example
        await prisma.aITrainingExample.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Training example deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting training example:', error);
        return NextResponse.json(
            { error: 'Failed to delete training example' },
            { status: 500 }
        );
    }
}