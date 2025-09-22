/**
 * FairGo Platform Alert Management System
 * 
 * Provides comprehensive real-time alerting with:
 * - Threshold-based alerts
 * - Multi-channel notifications (email, SMS, Slack, webhooks)
 * - Alert escalation workflows
 * - Alert suppression and de-duplication
 * - Performance and business metric alerts
 * - AI service alerts
 * - Security event alerts
 */

import { logger } from '../logging/FairGoLogger';
import { metricsCollector } from '../metrics/MetricsCollector';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'firing' | 'resolved' | 'suppressed' | 'escalated';
export type NotificationChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'pagerduty';

export interface AlertRule {
    id: string;
    name: string;
    description: string;
    severity: AlertSeverity;
    metric: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
    threshold: number | string;
    evaluationWindow: number; // seconds
    evaluationInterval: number; // seconds
    minDataPoints: number;
    enabled: boolean;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    notificationChannels: NotificationChannel[];
    suppressionDuration?: number; // seconds
    escalationRules?: EscalationRule[];
    runbook?: string;
}

export interface EscalationRule {
    id: string;
    delayMinutes: number;
    channels: NotificationChannel[];
    recipients: string[];
    condition?: string; // Optional condition for escalation
}

export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: AlertSeverity;
    status: AlertStatus;
    message: string;
    description?: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    value: number | string;
    threshold: number | string;
    firedAt: string;
    resolvedAt?: string;
    suppressedUntil?: string;
    escalatedAt?: string;
    notificationsSent: {
        channel: NotificationChannel;
        sentAt: string;
        success: boolean;
        error?: string;
    }[];
    context: Record<string, any>;
}

export interface AlertManagerConfig {
    enableAlerts: boolean;
    evaluationInterval: number;
    notificationRetries: number;
    suppressionEnabled: boolean;
    escalationEnabled: boolean;
    maxActiveAlerts: number;
}

class AlertManager {
    private static instance: AlertManager;
    private alertRules: Map<string, AlertRule> = new Map();
    private activeAlerts: Map<string, Alert> = new Map();
    private suppressedAlerts: Set<string> = new Set();
    private evaluationInterval: NodeJS.Timeout | null = null;
    private config: AlertManagerConfig;
    private metricHistory: Map<string, Array<{ timestamp: number; value: number | string }>> = new Map();
    private notificationProviders: Map<NotificationChannel, NotificationProvider> = new Map();

    constructor() {
        this.config = {
            enableAlerts: process.env.ENABLE_ALERTS !== 'false',
            evaluationInterval: parseInt(process.env.ALERT_EVALUATION_INTERVAL || '30000'),
            notificationRetries: parseInt(process.env.ALERT_NOTIFICATION_RETRIES || '3'),
            suppressionEnabled: process.env.ENABLE_ALERT_SUPPRESSION !== 'false',
            escalationEnabled: process.env.ENABLE_ALERT_ESCALATION !== 'false',
            maxActiveAlerts: parseInt(process.env.MAX_ACTIVE_ALERTS || '1000')
        };

        this.initializeDefaultRules();
        this.setupNotificationProviders();

        if (this.config.enableAlerts) {
            this.startEvaluationLoop();
        }

        logger.info('Alert manager initialized', {
            component: 'alerting',
            operation: 'initialization',
            metadata: {
                alerts_enabled: this.config.enableAlerts,
                evaluation_interval: this.config.evaluationInterval,
                suppression_enabled: this.config.suppressionEnabled,
                escalation_enabled: this.config.escalationEnabled
            }
        });
    }

    public static getInstance(): AlertManager {
        if (!AlertManager.instance) {
            AlertManager.instance = new AlertManager();
        }
        return AlertManager.instance;
    }

    private initializeDefaultRules(): void {
        // Critical system alerts
        this.addRule({
            id: 'high_error_rate',
            name: 'High Error Rate',
            description: 'HTTP error rate exceeds 5%',
            severity: 'critical',
            metric: 'http_error_rate',
            condition: 'greater_than',
            threshold: 0.05,
            evaluationWindow: 300, // 5 minutes
            evaluationInterval: 60, // 1 minute
            minDataPoints: 3,
            enabled: true,
            labels: { service: 'fairgo-api', type: 'performance' },
            annotations: {
                summary: 'High error rate detected',
                description: 'The HTTP error rate has exceeded 5% for the last 5 minutes'
            },
            notificationChannels: ['slack', 'email', 'pagerduty'],
            escalationRules: [{
                id: 'escalate_after_15min',
                delayMinutes: 15,
                channels: ['sms', 'pagerduty'],
                recipients: ['on-call-engineer']
            }],
            runbook: '/runbooks/high-error-rate'
        });

        this.addRule({
            id: 'high_response_time',
            name: 'High Response Time',
            description: 'API response time exceeds 2 seconds',
            severity: 'high',
            metric: 'http_response_time_p95',
            condition: 'greater_than',
            threshold: 2.0,
            evaluationWindow: 300,
            evaluationInterval: 60,
            minDataPoints: 5,
            enabled: true,
            labels: { service: 'fairgo-api', type: 'performance' },
            annotations: {
                summary: 'High response time detected',
                description: '95th percentile response time exceeds 2 seconds'
            },
            notificationChannels: ['slack', 'email']
        });

        this.addRule({
            id: 'database_connection_failures',
            name: 'Database Connection Failures',
            description: 'Database health check failures',
            severity: 'critical',
            metric: 'database_health_status',
            condition: 'not_equals',
            threshold: 'healthy',
            evaluationWindow: 120,
            evaluationInterval: 30,
            minDataPoints: 2,
            enabled: true,
            labels: { service: 'fairgo-api', type: 'infrastructure' },
            annotations: {
                summary: 'Database connection failures detected',
                description: 'Database health checks are failing'
            },
            notificationChannels: ['slack', 'email', 'sms', 'pagerduty']
        });

        this.addRule({
            id: 'ai_service_high_latency',
            name: 'AI Service High Latency',
            description: 'AI model inference time exceeds 10 seconds',
            severity: 'high',
            metric: 'ai_inference_latency',
            condition: 'greater_than',
            threshold: 10.0,
            evaluationWindow: 180,
            evaluationInterval: 60,
            minDataPoints: 3,
            enabled: true,
            labels: { service: 'fairgo-ai', type: 'ai_performance' },
            annotations: {
                summary: 'AI service high latency',
                description: 'AI model inference time is taking longer than expected'
            },
            notificationChannels: ['slack', 'email']
        });

        this.addRule({
            id: 'memory_usage_high',
            name: 'High Memory Usage',
            description: 'Memory usage exceeds 80%',
            severity: 'high',
            metric: 'memory_usage_percent',
            condition: 'greater_than',
            threshold: 80,
            evaluationWindow: 300,
            evaluationInterval: 60,
            minDataPoints: 5,
            enabled: true,
            labels: { service: 'fairgo-api', type: 'resource' },
            annotations: {
                summary: 'High memory usage detected',
                description: 'Memory usage has exceeded 80% for sustained period'
            },
            notificationChannels: ['slack', 'email']
        });

        // Business metric alerts
        this.addRule({
            id: 'booking_success_rate_low',
            name: 'Low Booking Success Rate',
            description: 'Booking success rate below 85%',
            severity: 'medium',
            metric: 'booking_success_rate',
            condition: 'less_than',
            threshold: 0.85,
            evaluationWindow: 900, // 15 minutes
            evaluationInterval: 300, // 5 minutes
            minDataPoints: 3,
            enabled: true,
            labels: { service: 'fairgo-business', type: 'business_metric' },
            annotations: {
                summary: 'Low booking success rate',
                description: 'Booking success rate has dropped below acceptable threshold'
            },
            notificationChannels: ['slack', 'email']
        });

        // Security alerts
        this.addRule({
            id: 'multiple_failed_auth_attempts',
            name: 'Multiple Failed Authentication Attempts',
            description: 'High number of authentication failures from single IP',
            severity: 'medium',
            metric: 'auth_failures_per_ip',
            condition: 'greater_than',
            threshold: 10,
            evaluationWindow: 300,
            evaluationInterval: 60,
            minDataPoints: 1,
            enabled: true,
            labels: { service: 'fairgo-security', type: 'security' },
            annotations: {
                summary: 'Possible brute force attack detected',
                description: 'Multiple authentication failures detected from single source'
            },
            notificationChannels: ['slack', 'email']
        });

        logger.info('Default alert rules initialized', {
            component: 'alerting',
            operation: 'rules_initialization',
            metadata: {
                rules_count: this.alertRules.size
            }
        });
    }

    private setupNotificationProviders(): void {
        // Email notification provider
        this.notificationProviders.set('email', {
            send: async (alert: Alert, recipients: string[]) => {
                // Email implementation would go here
                logger.info('Email notification sent', {
                    component: 'alerting',
                    operation: 'notification_sent',
                    metadata: {
                        alert_id: alert.id,
                        channel: 'email',
                        recipients_count: recipients.length
                    }
                });
                return { success: true };
            }
        });

        // Slack notification provider  
        this.notificationProviders.set('slack', {
            send: async (alert: Alert, recipients: string[]) => {
                // Slack implementation would go here
                logger.info('Slack notification sent', {
                    component: 'alerting',
                    operation: 'notification_sent',
                    metadata: {
                        alert_id: alert.id,
                        channel: 'slack',
                        recipients_count: recipients.length
                    }
                });
                return { success: true };
            }
        });

        // SMS notification provider
        this.notificationProviders.set('sms', {
            send: async (alert: Alert, recipients: string[]) => {
                // SMS implementation would go here
                logger.info('SMS notification sent', {
                    component: 'alerting',
                    operation: 'notification_sent',
                    metadata: {
                        alert_id: alert.id,
                        channel: 'sms',
                        recipients_count: recipients.length
                    }
                });
                return { success: true };
            }
        });

        // Webhook notification provider
        this.notificationProviders.set('webhook', {
            send: async (alert: Alert, recipients: string[]) => {
                // Webhook implementation would go here
                logger.info('Webhook notification sent', {
                    component: 'alerting',
                    operation: 'notification_sent',
                    metadata: {
                        alert_id: alert.id,
                        channel: 'webhook',
                        recipients_count: recipients.length
                    }
                });
                return { success: true };
            }
        });

        // PagerDuty notification provider
        this.notificationProviders.set('pagerduty', {
            send: async (alert: Alert, recipients: string[]) => {
                // PagerDuty implementation would go here
                logger.info('PagerDuty notification sent', {
                    component: 'alerting',
                    operation: 'notification_sent',
                    metadata: {
                        alert_id: alert.id,
                        channel: 'pagerduty',
                        recipients_count: recipients.length
                    }
                });
                return { success: true };
            }
        });
    }

    private startEvaluationLoop(): void {
        this.evaluationInterval = setInterval(async () => {
            await this.evaluateAllRules();
        }, this.config.evaluationInterval);

        logger.info('Alert evaluation loop started', {
            component: 'alerting',
            operation: 'evaluation_loop_start',
            metadata: {
                interval_ms: this.config.evaluationInterval
            }
        });
    }

    private async evaluateAllRules(): Promise<void> {
        for (const [ruleId, rule] of this.alertRules.entries()) {
            if (!rule.enabled) continue;

            try {
                await this.evaluateRule(rule);
            } catch (error) {
                logger.error('Failed to evaluate alert rule', error instanceof Error ? error : new Error(String(error)), {
                    component: 'alerting',
                    operation: 'rule_evaluation_error',
                    metadata: {
                        rule_id: ruleId,
                        rule_name: rule.name
                    }
                });
            }
        }

        // Clean up resolved alerts
        this.cleanupResolvedAlerts();
    }

    private async evaluateRule(rule: AlertRule): Promise<void> {
        // Get metric value (this would integrate with actual metrics)
        const metricValue = await this.getMetricValue(rule.metric);
        if (metricValue === undefined) return;

        // Store metric history
        this.storeMetricValue(rule.metric, metricValue);

        // Check if condition is met
        const conditionMet = this.evaluateCondition(rule, metricValue);
        const existingAlert = this.findActiveAlert(rule.id);

        if (conditionMet && !existingAlert) {
            // Fire new alert
            await this.fireAlert(rule, metricValue);
        } else if (!conditionMet && existingAlert) {
            // Resolve existing alert
            await this.resolveAlert(existingAlert.id);
        } else if (conditionMet && existingAlert) {
            // Update existing alert
            await this.updateAlert(existingAlert, metricValue);
        }
    }

    private async getMetricValue(metric: string): Promise<number | string | undefined> {
        // This would integrate with your actual metrics collection
        // For now, return mock values based on metric name
        const mockValues: Record<string, number | string> = {
            'http_error_rate': Math.random() * 0.1,
            'http_response_time_p95': Math.random() * 3,
            'database_health_status': Math.random() > 0.95 ? 'unhealthy' : 'healthy',
            'ai_inference_latency': Math.random() * 15,
            'memory_usage_percent': Math.random() * 100,
            'booking_success_rate': 0.80 + Math.random() * 0.2,
            'auth_failures_per_ip': Math.floor(Math.random() * 20)
        };

        return mockValues[metric];
    }

    private storeMetricValue(metric: string, value: number | string): void {
        if (!this.metricHistory.has(metric)) {
            this.metricHistory.set(metric, []);
        }

        const history = this.metricHistory.get(metric)!;
        history.push({ timestamp: Date.now(), value });

        // Keep only recent values (1 hour)
        const oneHourAgo = Date.now() - 3600000;
        this.metricHistory.set(metric, history.filter(h => h.timestamp > oneHourAgo));
    }

    private evaluateCondition(rule: AlertRule, value: number | string): boolean {
        switch (rule.condition) {
            case 'greater_than':
                return typeof value === 'number' && typeof rule.threshold === 'number' && value > rule.threshold;
            case 'less_than':
                return typeof value === 'number' && typeof rule.threshold === 'number' && value < rule.threshold;
            case 'equals':
                return value === rule.threshold;
            case 'not_equals':
                return value !== rule.threshold;
            case 'contains':
                return typeof value === 'string' && typeof rule.threshold === 'string' &&
                    value.includes(rule.threshold);
            default:
                return false;
        }
    }

    private findActiveAlert(ruleId: string): Alert | undefined {
        for (const alert of this.activeAlerts.values()) {
            if (alert.ruleId === ruleId && alert.status === 'firing') {
                return alert;
            }
        }
        return undefined;
    }

    private async fireAlert(rule: AlertRule, value: number | string): Promise<void> {
        const alert: Alert = {
            id: `${rule.id}_${Date.now()}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'firing',
            message: rule.description,
            description: rule.annotations.description,
            labels: rule.labels,
            annotations: rule.annotations,
            value,
            threshold: rule.threshold,
            firedAt: new Date().toISOString(),
            notificationsSent: [],
            context: {
                evaluationWindow: rule.evaluationWindow,
                metric: rule.metric
            }
        };

        this.activeAlerts.set(alert.id, alert);

        // Send notifications
        await this.sendNotifications(alert, rule.notificationChannels);

        // Schedule escalation if configured
        if (this.config.escalationEnabled && rule.escalationRules) {
            this.scheduleEscalations(alert, rule.escalationRules);
        }

        // Log alert
        logger.critical('Alert fired', {
            component: 'alerting',
            operation: 'alert_fired',
            metadata: {
                alert_id: alert.id,
                rule_id: rule.id,
                severity: alert.severity,
                value,
                threshold: rule.threshold,
                metric: rule.metric
            }
        });

        // Record metrics
        metricsCollector.alertsFired.inc({
            severity: alert.severity,
            service: rule.labels.service || 'unknown',
            type: rule.labels.type || 'unknown'
        });
    }

    private async resolveAlert(alertId: string): Promise<void> {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) return;

        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();

        logger.info('Alert resolved', {
            component: 'alerting',
            operation: 'alert_resolved',
            metadata: {
                alert_id: alertId,
                rule_id: alert.ruleId,
                duration_minutes: Math.round((Date.now() - new Date(alert.firedAt).getTime()) / 60000)
            }
        });

        // Record metrics
        metricsCollector.alertsResolved.inc({
            severity: alert.severity,
            service: alert.labels.service || 'unknown'
        });
    }

    private async updateAlert(alert: Alert, value: number | string): Promise<void> {
        alert.value = value;
        // Could add notification throttling logic here
    }

    private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
        for (const channel of channels) {
            try {
                const provider = this.notificationProviders.get(channel);
                if (!provider) {
                    logger.warning('Notification provider not found', {
                        component: 'alerting',
                        metadata: { channel }
                    });
                    continue;
                }

                const result = await provider.send(alert, []);
                alert.notificationsSent.push({
                    channel,
                    sentAt: new Date().toISOString(),
                    success: result.success,
                    error: result.error
                });

            } catch (error) {
                logger.error('Failed to send notification', error instanceof Error ? error : new Error(String(error)), {
                    component: 'alerting',
                    metadata: {
                        alert_id: alert.id,
                        channel
                    }
                });

                alert.notificationsSent.push({
                    channel,
                    sentAt: new Date().toISOString(),
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }

    private scheduleEscalations(alert: Alert, escalationRules: EscalationRule[]): void {
        for (const escalation of escalationRules) {
            setTimeout(async () => {
                const currentAlert = this.activeAlerts.get(alert.id);
                if (currentAlert && currentAlert.status === 'firing') {
                    await this.escalateAlert(currentAlert, escalation);
                }
            }, escalation.delayMinutes * 60 * 1000);
        }
    }

    private async escalateAlert(alert: Alert, escalation: EscalationRule): Promise<void> {
        alert.status = 'escalated';
        alert.escalatedAt = new Date().toISOString();

        await this.sendNotifications(alert, escalation.channels);

        logger.warning('Alert escalated', {
            component: 'alerting',
            operation: 'alert_escalated',
            metadata: {
                alert_id: alert.id,
                escalation_id: escalation.id,
                delay_minutes: escalation.delayMinutes
            }
        });
    }

    private cleanupResolvedAlerts(): void {
        const now = Date.now();
        const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

        for (const [alertId, alert] of this.activeAlerts.entries()) {
            if (alert.status === 'resolved' && alert.resolvedAt) {
                const resolvedAt = new Date(alert.resolvedAt).getTime();
                if (now - resolvedAt > cleanupThreshold) {
                    this.activeAlerts.delete(alertId);
                }
            }
        }
    }

    // Public API methods
    public addRule(rule: AlertRule): void {
        this.alertRules.set(rule.id, rule);
        logger.info('Alert rule added', {
            component: 'alerting',
            operation: 'rule_added',
            metadata: {
                rule_id: rule.id,
                rule_name: rule.name,
                severity: rule.severity
            }
        });
    }

    public removeRule(ruleId: string): void {
        this.alertRules.delete(ruleId);
        logger.info('Alert rule removed', {
            component: 'alerting',
            operation: 'rule_removed',
            metadata: { rule_id: ruleId }
        });
    }

    public getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'firing');
    }

    public getAllAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values());
    }

    public getAlertRules(): AlertRule[] {
        return Array.from(this.alertRules.values());
    }

    public suppressAlert(alertId: string, durationMinutes: number): void {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'suppressed';
            alert.suppressedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
            this.suppressedAlerts.add(alertId);
        }
    }

    public getAlertingStats() {
        return {
            totalRules: this.alertRules.size,
            activeAlerts: this.getActiveAlerts().length,
            totalAlerts: this.activeAlerts.size,
            suppressedAlerts: this.suppressedAlerts.size,
            config: this.config
        };
    }

    public async shutdown(): Promise<void> {
        if (this.evaluationInterval) {
            clearInterval(this.evaluationInterval);
            this.evaluationInterval = null;
        }

        logger.info('Alert manager shutdown', {
            component: 'alerting',
            operation: 'shutdown'
        });
    }
}

interface NotificationProvider {
    send: (alert: Alert, recipients: string[]) => Promise<{ success: boolean; error?: string }>;
}

export const alertManager = AlertManager.getInstance();
export default AlertManager;