// Simple health check for Railway - minimal dependencies
export async function GET() {
    return new Response(
        JSON.stringify({
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: 'fairgo-platform'
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        }
    );
}