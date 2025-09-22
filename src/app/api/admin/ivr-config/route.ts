import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Mock implementation - replace with actual service when IVR service is integrated
class MockAdminDashboardConfigService {
    async getConfiguration() {
        // Mock configuration data
        return {
            agents: [
                {
                    id: 'booking-coordinator',
                    name: 'Booking Coordinator',
                    type: 'booking',
                    isActive: true,
                    model: 'gpt-4',
                    systemPrompt: 'You are Priya, a friendly booking assistant for FairGo...',
                    customInstructions: 'Handle Kerala locations and Malayalam phrases...',
                    performance: {
                        successRate: 85,
                        avgCallDuration: 45,
                        userSatisfaction: 4.2
                    }
                }
            ],
            aiServices: {
                openai: {
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'gpt-4',
                    temperature: 0.3,
                    maxTokens: 150,
                    isEnabled: !!process.env.OPENAI_API_KEY
                },
                googleCloud: {
                    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
                    credentialsJson: '',
                    isEnabled: !!process.env.GOOGLE_CLOUD_PROJECT
                },
                twilio: {
                    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
                    authToken: process.env.TWILIO_AUTH_TOKEN || '',
                    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
                    isEnabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
                }
            },
            systemSettings: {
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ml', 'hi'],
                sessionTimeout: 15,
                maxConcurrentCalls: 100,
                recordCalls: true,
                enableAnalytics: true
            }
        };
    }

    async updateAIServiceConfig(updates: any) {
        // Mock implementation - in real scenario, this would update the database
        console.log('Updating AI service config:', updates);
        return true;
    }

    async updateSystemSettings(settings: any) {
        // Mock implementation - in real scenario, this would update the database
        console.log('Updating system settings:', settings);
        return true;
    }

    async saveAgentConfig(agent: any) {
        // Mock implementation - in real scenario, this would save to database
        console.log('Saving agent config:', agent);
        return true;
    }

    async deleteAgentConfig(agentId: string) {
        // Mock implementation - in real scenario, this would delete from database
        console.log('Deleting agent config:', agentId);
        return true;
    }

    async testAPIConnectivity() {
        return {
            openai: !!process.env.OPENAI_API_KEY,
            googleCloud: !!process.env.GOOGLE_CLOUD_PROJECT,
            twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
            database: true // Assume database is connected
        };
    }
}

const configService = new MockAdminDashboardConfigService();

export async function GET() {
    try {
        const configuration = await configService.getConfiguration();
        return NextResponse.json(configuration);
    } catch (error) {
        console.error('Error fetching IVR configuration:', error);
        return NextResponse.json(
            { error: 'Failed to fetch configuration' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const updates = await request.json();

        if (updates.aiServices) {
            await configService.updateAIServiceConfig(updates.aiServices);
        }

        if (updates.systemSettings) {
            await configService.updateSystemSettings(updates.systemSettings);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating IVR configuration:', error);
        return NextResponse.json(
            { error: 'Failed to update configuration' },
            { status: 500 }
        );
    }
}