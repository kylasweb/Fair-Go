import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/config/[id] - Get specific configuration
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const config = await prisma.appConfig.findUnique({
            where: { id }
        });

        if (!config) {
            return NextResponse.json(
                { error: 'Configuration not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(config);

    } catch (error) {
        console.error('Error fetching configuration:', error);
        return NextResponse.json(
            { error: 'Failed to fetch configuration' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/config/[id] - Update configuration
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { value, description } = body;

        // Check if configuration exists
        const existingConfig = await prisma.appConfig.findUnique({
            where: { id }
        });

        if (!existingConfig) {
            return NextResponse.json(
                { error: 'Configuration not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (value !== undefined) updateData.value = value;
        if (description !== undefined) updateData.description = description;

        // Update the configuration
        const updatedConfig = await prisma.appConfig.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            message: 'Configuration updated successfully',
            config: updatedConfig
        });

    } catch (error) {
        console.error('Error updating configuration:', error);
        return NextResponse.json(
            { error: 'Failed to update configuration' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/config/[id] - Delete configuration
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if configuration exists and is not system config
        const existingConfig = await prisma.appConfig.findUnique({
            where: { id }
        });

        if (!existingConfig) {
            return NextResponse.json(
                { error: 'Configuration not found' },
                { status: 404 }
            );
        }

        if (existingConfig.isSystem) {
            return NextResponse.json(
                { error: 'Cannot delete system configuration' },
                { status: 403 }
            );
        }

        // Delete the configuration
        await prisma.appConfig.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Configuration deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting configuration:', error);
        return NextResponse.json(
            { error: 'Failed to delete configuration' },
            { status: 500 }
        );
    }
}