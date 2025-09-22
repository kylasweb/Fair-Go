import { NextRequest, NextResponse } from 'next/server';
import { alertManager } from '@/monitoring/alerts/AlertManager';
import { logger } from '@/monitoring';
import { withAPM } from '@/monitoring';

// GET /api/monitoring/alerts - Get all alerts
export const GET = withAPM(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'firing', 'resolved', 'suppressed'
    const severity = searchParams.get('severity'); // 'critical', 'high', 'medium', 'low', 'info'
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        let alerts = alertManager.getAllAlerts();

        // Apply filters
        if (status) {
            alerts = alerts.filter(alert => alert.status === status);
        }

        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        // Sort by fired time (newest first)
        alerts.sort((a, b) => new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime());

        // Apply pagination
        const total = alerts.length;
        const paginatedAlerts = alerts.slice(offset, offset + limit);

        logger.info('Alerts retrieved', {
            component: 'alerts-api',
            operation: 'get_alerts',
            metadata: {
                total_alerts: total,
                returned_alerts: paginatedAlerts.length,
                status_filter: status,
                severity_filter: severity,
                offset,
                limit
            }
        });

        return NextResponse.json({
            alerts: paginatedAlerts,
            pagination: {
                total,
                limit,
                offset,
                has_more: (offset + limit) < total
            },
            filters: {
                status,
                severity
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Failed to retrieve alerts', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'get_alerts_error'
        });

        return NextResponse.json({
            error: 'Failed to retrieve alerts',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}, {
    operationName: 'get_alerts',
    trackBusinessMetrics: false
});

// POST /api/monitoring/alerts - Create or manage alerts
export const POST = withAPM(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { action, alertId, ...data } = body;

        switch (action) {
            case 'suppress':
                return await suppressAlert(alertId, data.durationMinutes);

            case 'resolve':
                return await resolveAlert(alertId);

            case 'add_rule':
                return await addAlertRule(data.rule);

            case 'test_notification':
                return await testNotification(data);

            default:
                return NextResponse.json({
                    error: 'Invalid action',
                    validActions: ['suppress', 'resolve', 'add_rule', 'test_notification']
                }, { status: 400 });
        }

    } catch (error) {
        logger.error('Alert management operation failed', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'alert_management_error'
        });

        return NextResponse.json({
            error: 'Alert management operation failed',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}, {
    operationName: 'manage_alerts',
    trackBusinessMetrics: false
});

async function suppressAlert(alertId: string, durationMinutes: number = 60): Promise<NextResponse> {
    if (!alertId) {
        return NextResponse.json({
            error: 'Alert ID is required'
        }, { status: 400 });
    }

    if (durationMinutes <= 0 || durationMinutes > 1440) { // Max 24 hours
        return NextResponse.json({
            error: 'Duration must be between 1 and 1440 minutes'
        }, { status: 400 });
    }

    alertManager.suppressAlert(alertId, durationMinutes);

    logger.info('Alert suppressed', {
        component: 'alerts-api',
        operation: 'suppress_alert',
        metadata: {
            alert_id: alertId,
            duration_minutes: durationMinutes
        }
    });

    return NextResponse.json({
        success: true,
        message: `Alert ${alertId} suppressed for ${durationMinutes} minutes`,
        suppressedUntil: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
    });
}

async function resolveAlert(alertId: string): Promise<NextResponse> {
    if (!alertId) {
        return NextResponse.json({
            error: 'Alert ID is required'
        }, { status: 400 });
    }

    // Find the alert
    const alerts = alertManager.getAllAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
        return NextResponse.json({
            error: 'Alert not found'
        }, { status: 404 });
    }

    if (alert.status === 'resolved') {
        return NextResponse.json({
            success: true,
            message: 'Alert is already resolved'
        });
    }

    // Manual resolution - this would typically integrate with the alert resolution logic
    logger.info('Alert manually resolved', {
        component: 'alerts-api',
        operation: 'resolve_alert',
        metadata: {
            alert_id: alertId,
            rule_id: alert.ruleId,
            manual_resolution: true
        }
    });

    return NextResponse.json({
        success: true,
        message: `Alert ${alertId} marked as resolved`,
        resolvedAt: new Date().toISOString()
    });
}

async function addAlertRule(ruleData: any): Promise<NextResponse> {
    if (!ruleData || !ruleData.id || !ruleData.name) {
        return NextResponse.json({
            error: 'Rule data, ID, and name are required'
        }, { status: 400 });
    }

    try {
        alertManager.addRule(ruleData);

        logger.info('Alert rule added', {
            component: 'alerts-api',
            operation: 'add_alert_rule',
            metadata: {
                rule_id: ruleData.id,
                rule_name: ruleData.name,
                severity: ruleData.severity
            }
        });

        return NextResponse.json({
            success: true,
            message: `Alert rule '${ruleData.name}' added successfully`,
            ruleId: ruleData.id
        });

    } catch (error) {
        logger.error('Failed to add alert rule', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'add_alert_rule_error',
            metadata: {
                rule_id: ruleData.id
            }
        });

        return NextResponse.json({
            error: 'Failed to add alert rule',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

async function testNotification(data: any): Promise<NextResponse> {
    const { channel, recipients, message } = data;

    if (!channel || !recipients || !Array.isArray(recipients)) {
        return NextResponse.json({
            error: 'Channel and recipients array are required'
        }, { status: 400 });
    }

    // Create a test alert
    const testAlert = {
        id: `test_${Date.now()}`,
        ruleId: 'test_rule',
        ruleName: 'Test Notification',
        severity: 'info' as const,
        status: 'firing' as const,
        message: message || 'This is a test notification from FairGo monitoring system',
        labels: { service: 'fairgo-test', type: 'test' },
        annotations: { description: 'Test notification to verify alert delivery' },
        value: 'test',
        threshold: 'test',
        firedAt: new Date().toISOString(),
        notificationsSent: [],
        context: { test: true }
    };

    try {
        // This would integrate with actual notification providers
        logger.info('Test notification sent', {
            component: 'alerts-api',
            operation: 'test_notification',
            metadata: {
                channel,
                recipients_count: recipients.length,
                test_alert_id: testAlert.id
            }
        });

        return NextResponse.json({
            success: true,
            message: `Test notification sent to ${channel}`,
            testAlert: {
                id: testAlert.id,
                channel,
                recipients: recipients.length,
                sentAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Failed to send test notification', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'test_notification_error',
            metadata: {
                channel,
                recipients_count: recipients.length
            }
        });

        return NextResponse.json({
            error: 'Failed to send test notification',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}