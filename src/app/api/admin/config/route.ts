import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/config - Get all configuration settings
export async function GET(request: NextRequest) {
    try {
        const configs = await prisma.appConfig.findMany({
            orderBy: {
                key: 'asc'
            }
        });

        return NextResponse.json(configs);

    } catch (error) {
        console.error('Error fetching configuration:', error);
        return NextResponse.json(
            { error: 'Failed to fetch configuration' },
            { status: 500 }
        );
    }
}

// POST /api/admin/config - Create new configuration setting
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, value, description, isSystem = false } = body;

        // Validate required fields
        if (!key || !value) {
            return NextResponse.json(
                { error: 'Key and value are required' },
                { status: 400 }
            );
        }

        // Check if key already exists
        const existingConfig = await prisma.appConfig.findUnique({
            where: { key }
        });

        if (existingConfig) {
            return NextResponse.json(
                { error: 'Configuration key already exists' },
                { status: 409 }
            );
        }

        // Create the configuration
        const config = await prisma.appConfig.create({
            data: {
                key,
                value,
                description,
                isSystem,
            }
        });

        return NextResponse.json({
            message: 'Configuration created successfully',
            config
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating configuration:', error);
        return NextResponse.json(
            { error: 'Failed to create configuration' },
            { status: 500 }
        );
    }
}