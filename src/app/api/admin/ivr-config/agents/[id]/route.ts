import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const agentId = params.id;

        // Mock implementation for deleting agents
        console.log('Deleting agent configuration:', agentId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting agent configuration:', error);
        return NextResponse.json(
            { error: 'Failed to delete agent configuration' },
            { status: 500 }
        );
    }
}