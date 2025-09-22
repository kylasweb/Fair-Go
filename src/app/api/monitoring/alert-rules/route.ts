import { NextRequest, NextResponse } from 'next/server';
import { alertManager } from '@/monitoring/alerts/AlertManager';
import { logger } from '@/monitoring';
import { withAPM } from '@/monitoring';

// GET /api/monitoring/alert-rules - Get all alert rules
export const GET = withAPM(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled'); // 'true', 'false'
    const severity = searchParams.get('severity');

    try {
        let rules = alertManager.getAlertRules();

        // Apply filters
        if (enabled !== null) {
            const enabledFilter = enabled === 'true';
            rules = rules.filter(rule => rule.enabled === enabledFilter);
        }

        if (severity) {
            rules = rules.filter(rule => rule.severity === severity);
        }

        // Sort by severity and name
        const severityOrder = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4, 'info': 5 };
        rules.sort((a, b) => {
            const severityDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
            if (severityDiff !== 0) return severityDiff;
            return a.name.localeCompare(b.name);
        });

        logger.info('Alert rules retrieved', {
            component: 'alerts-api',
            operation: 'get_alert_rules',
            metadata: {
                total_rules: rules.length,
                enabled_filter: enabled,
                severity_filter: severity
            }
        });

        return NextResponse.json({
            rules: rules,
            summary: {
                total: rules.length,
                enabled: rules.filter(r => r.enabled).length,
                disabled: rules.filter(r => !r.enabled).length,
                by_severity: {
                    critical: rules.filter(r => r.severity === 'critical').length,
                    high: rules.filter(r => r.severity === 'high').length,
                    medium: rules.filter(r => r.severity === 'medium').length,
                    low: rules.filter(r => r.severity === 'low').length,
                    info: rules.filter(r => r.severity === 'info').length
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Failed to retrieve alert rules', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'get_alert_rules_error'
        });

        return NextResponse.json({
            error: 'Failed to retrieve alert rules',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}, {
    operationName: 'get_alert_rules',
    trackBusinessMetrics: false
});

// POST /api/monitoring/alert-rules - Create new alert rule
export const POST = withAPM(async (request: NextRequest) => {
    try {
        const ruleData = await request.json();

        // Validate required fields
        const requiredFields = ['id', 'name', 'description', 'severity', 'metric', 'condition', 'threshold'];
        const missingFields = requiredFields.filter(field => !(field in ruleData));

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: 'Missing required fields',
                missingFields,
                requiredFields
            }, { status: 400 });
        }

        // Validate severity
        const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
        if (!validSeverities.includes(ruleData.severity)) {
            return NextResponse.json({
                error: 'Invalid severity',
                validSeverities
            }, { status: 400 });
        }

        // Validate condition
        const validConditions = ['greater_than', 'less_than', 'equals', 'not_equals', 'contains'];
        if (!validConditions.includes(ruleData.condition)) {
            return NextResponse.json({
                error: 'Invalid condition',
                validConditions
            }, { status: 400 });
        }

        // Set defaults
        const rule = {
            evaluationWindow: 300,
            evaluationInterval: 60,
            minDataPoints: 3,
            enabled: true,
            labels: {},
            annotations: {},
            notificationChannels: ['slack'],
            ...ruleData
        };

        // Check if rule ID already exists
        const existingRules = alertManager.getAlertRules();
        if (existingRules.some(r => r.id === rule.id)) {
            return NextResponse.json({
                error: 'Alert rule with this ID already exists',
                existingId: rule.id
            }, { status: 409 });
        }

        alertManager.addRule(rule);

        logger.info('Alert rule created', {
            component: 'alerts-api',
            operation: 'create_alert_rule',
            metadata: {
                rule_id: rule.id,
                rule_name: rule.name,
                severity: rule.severity,
                metric: rule.metric,
                enabled: rule.enabled
            }
        });

        return NextResponse.json({
            success: true,
            message: `Alert rule '${rule.name}' created successfully`,
            rule: {
                id: rule.id,
                name: rule.name,
                severity: rule.severity,
                enabled: rule.enabled,
                createdAt: new Date().toISOString()
            }
        }, { status: 201 });

    } catch (error) {
        logger.error('Failed to create alert rule', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'create_alert_rule_error'
        });

        return NextResponse.json({
            error: 'Failed to create alert rule',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}, {
    operationName: 'create_alert_rule',
    trackBusinessMetrics: false
});

// PUT /api/monitoring/alert-rules - Update alert rule
export const PUT = withAPM(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const ruleId = searchParams.get('id');

        if (!ruleId) {
            return NextResponse.json({
                error: 'Rule ID is required as query parameter'
            }, { status: 400 });
        }

        const updateData = await request.json();

        // Find existing rule
        const existingRules = alertManager.getAlertRules();
        const existingRule = existingRules.find(r => r.id === ruleId);

        if (!existingRule) {
            return NextResponse.json({
                error: 'Alert rule not found',
                ruleId
            }, { status: 404 });
        }

        // Validate severity if provided
        if (updateData.severity) {
            const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
            if (!validSeverities.includes(updateData.severity)) {
                return NextResponse.json({
                    error: 'Invalid severity',
                    validSeverities
                }, { status: 400 });
            }
        }

        // Validate condition if provided
        if (updateData.condition) {
            const validConditions = ['greater_than', 'less_than', 'equals', 'not_equals', 'contains'];
            if (!validConditions.includes(updateData.condition)) {
                return NextResponse.json({
                    error: 'Invalid condition',
                    validConditions
                }, { status: 400 });
            }
        }

        // Merge with existing rule
        const updatedRule = {
            ...existingRule,
            ...updateData,
            id: ruleId, // Ensure ID cannot be changed
            updatedAt: new Date().toISOString()
        };

        // Remove old rule and add updated one
        alertManager.removeRule(ruleId);
        alertManager.addRule(updatedRule);

        logger.info('Alert rule updated', {
            component: 'alerts-api',
            operation: 'update_alert_rule',
            metadata: {
                rule_id: ruleId,
                rule_name: updatedRule.name,
                changes: Object.keys(updateData)
            }
        });

        return NextResponse.json({
            success: true,
            message: `Alert rule '${updatedRule.name}' updated successfully`,
            rule: {
                id: updatedRule.id,
                name: updatedRule.name,
                severity: updatedRule.severity,
                enabled: updatedRule.enabled,
                updatedAt: updatedRule.updatedAt
            }
        });

    } catch (error) {
        logger.error('Failed to update alert rule', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'update_alert_rule_error'
        });

        return NextResponse.json({
            error: 'Failed to update alert rule',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}, {
    operationName: 'update_alert_rule',
    trackBusinessMetrics: false
});

// DELETE /api/monitoring/alert-rules - Delete alert rule
export const DELETE = withAPM(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const ruleId = searchParams.get('id');

        if (!ruleId) {
            return NextResponse.json({
                error: 'Rule ID is required as query parameter'
            }, { status: 400 });
        }

        // Check if rule exists
        const existingRules = alertManager.getAlertRules();
        const existingRule = existingRules.find(r => r.id === ruleId);

        if (!existingRule) {
            return NextResponse.json({
                error: 'Alert rule not found',
                ruleId
            }, { status: 404 });
        }

        alertManager.removeRule(ruleId);

        logger.info('Alert rule deleted', {
            component: 'alerts-api',
            operation: 'delete_alert_rule',
            metadata: {
                rule_id: ruleId,
                rule_name: existingRule.name,
                severity: existingRule.severity
            }
        });

        return NextResponse.json({
            success: true,
            message: `Alert rule '${existingRule.name}' deleted successfully`,
            deletedRule: {
                id: ruleId,
                name: existingRule.name,
                deletedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Failed to delete alert rule', error instanceof Error ? error : new Error(String(error)), {
            component: 'alerts-api',
            operation: 'delete_alert_rule_error'
        });

        return NextResponse.json({
            error: 'Failed to delete alert rule',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}, {
    operationName: 'delete_alert_rule',
    trackBusinessMetrics: false
});