/**
 * FairGo Platform Notification Providers
 * 
 * Implements notification channels for alerts:
 * - Email notifications
 * - SMS via Twilio
 * - Slack integration
 * - WebHook notifications
 * - PagerDuty integration
 */

import { logger } from '../logging/FairGoLogger';
import { Alert } from './AlertManager';

export interface NotificationResult {
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
}

export abstract class NotificationProvider {
    abstract send(alert: Alert, recipients: string[]): Promise<NotificationResult>;

    protected formatAlertMessage(alert: Alert): string {
        return `🚨 ${alert.severity.toUpperCase()}: ${alert.ruleName}\n\n` +
            `Message: ${alert.message}\n` +
            `Value: ${alert.value} (Threshold: ${alert.threshold})\n` +
            `Service: ${alert.labels.service || 'unknown'}\n` +
            `Fired At: ${alert.firedAt}\n` +
            `Alert ID: ${alert.id}`;
    }

    protected getSeverityEmoji(severity: string): string {
        switch (severity) {
            case 'critical': return '🔥';
            case 'high': return '🚨';
            case 'medium': return '⚠️';
            case 'low': return '🔔';
            case 'info': return 'ℹ️';
            default: return '❓';
        }
    }
}

class EmailNotificationProvider extends NotificationProvider {
    private smtpConfig: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };

    constructor() {
        super();
        this.smtpConfig = {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASSWORD || ''
            }
        };
    }

    async send(alert: Alert, recipients: string[]): Promise<NotificationResult> {
        try {
            // In a real implementation, you would use nodemailer or similar
            // For now, we'll simulate the email sending

            const emailBody = this.buildEmailBody(alert);
            const subject = `[${alert.severity.toUpperCase()}] ${alert.ruleName} - FairGo Alert`;

            logger.info('Email notification prepared', {
                component: 'notifications',
                operation: 'email_send',
                metadata: {
                    alert_id: alert.id,
                    recipients_count: recipients.length,
                    subject,
                    smtp_host: this.smtpConfig.host
                }
            });

            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 100));

            // In production, you would:
            // const transporter = nodemailer.createTransporter(this.smtpConfig);
            // await transporter.sendMail({
            //     from: process.env.ALERT_EMAIL_FROM,
            //     to: recipients.join(','),
            //     subject,
            //     html: emailBody
            // });

            return {
                success: true,
                metadata: {
                    recipients_count: recipients.length,
                    subject
                }
            };
        } catch (error) {
            logger.error('Failed to send email notification', error instanceof Error ? error : new Error(String(error)), {
                component: 'notifications',
                operation: 'email_send_error',
                metadata: {
                    alert_id: alert.id,
                    recipients_count: recipients.length
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private buildEmailBody(alert: Alert): string {
        const emoji = this.getSeverityEmoji(alert.severity);

        return `
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center;">
                    <h1>${emoji} ${alert.severity.toUpperCase()} ALERT</h1>
                    <h2>${alert.ruleName}</h2>
                </div>
                
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <h3>Alert Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; font-weight: bold;">Message:</td>
                            <td style="padding: 8px;">${alert.message}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; font-weight: bold;">Current Value:</td>
                            <td style="padding: 8px;">${alert.value}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; font-weight: bold;">Threshold:</td>
                            <td style="padding: 8px;">${alert.threshold}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; font-weight: bold;">Service:</td>
                            <td style="padding: 8px;">${alert.labels.service || 'unknown'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; font-weight: bold;">Fired At:</td>
                            <td style="padding: 8px;">${new Date(alert.firedAt).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">Alert ID:</td>
                            <td style="padding: 8px;"><code>${alert.id}</code></td>
                        </tr>
                    </table>
                </div>
                
                ${alert.description ? `
                <div style="padding: 20px;">
                    <h3>Description</h3>
                    <p>${alert.description}</p>
                </div>
                ` : ''}
                
                <div style="padding: 20px; background-color: #e9e9e9; text-align: center;">
                    <p style="margin: 0; color: #666;">
                        This alert was generated by the FairGo monitoring system.<br>
                        Timestamp: ${new Date().toISOString()}
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#20c997';
            case 'info': return '#0dcaf0';
            default: return '#6c757d';
        }
    }
}

class SlackNotificationProvider extends NotificationProvider {
    private webhookUrl: string;
    private defaultChannel: string;

    constructor() {
        super();
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
        this.defaultChannel = process.env.SLACK_ALERTS_CHANNEL || '#alerts';
    }

    async send(alert: Alert, recipients: string[]): Promise<NotificationResult> {
        try {
            if (!this.webhookUrl) {
                throw new Error('Slack webhook URL not configured');
            }

            const slackMessage = this.buildSlackMessage(alert);

            // In a real implementation, you would make HTTP request to Slack
            // For now, we'll simulate it

            logger.info('Slack notification prepared', {
                component: 'notifications',
                operation: 'slack_send',
                metadata: {
                    alert_id: alert.id,
                    channel: this.defaultChannel,
                    webhook_configured: !!this.webhookUrl
                }
            });

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200));

            // In production, you would:
            // const response = await fetch(this.webhookUrl, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(slackMessage)
            // });

            return {
                success: true,
                metadata: {
                    channel: this.defaultChannel
                }
            };
        } catch (error) {
            logger.error('Failed to send Slack notification', error instanceof Error ? error : new Error(String(error)), {
                component: 'notifications',
                operation: 'slack_send_error',
                metadata: {
                    alert_id: alert.id,
                    channel: this.defaultChannel
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private buildSlackMessage(alert: Alert) {
        const emoji = this.getSeverityEmoji(alert.severity);
        const color = this.getSlackColor(alert.severity);

        return {
            channel: this.defaultChannel,
            username: 'FairGo Alerts',
            icon_emoji: ':rotating_light:',
            attachments: [
                {
                    color: color,
                    title: `${emoji} ${alert.severity.toUpperCase()}: ${alert.ruleName}`,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Current Value',
                            value: String(alert.value),
                            short: true
                        },
                        {
                            title: 'Threshold',
                            value: String(alert.threshold),
                            short: true
                        },
                        {
                            title: 'Service',
                            value: alert.labels.service || 'unknown',
                            short: true
                        },
                        {
                            title: 'Alert ID',
                            value: `\`${alert.id}\``,
                            short: true
                        }
                    ],
                    footer: 'FairGo Monitoring',
                    ts: Math.floor(new Date(alert.firedAt).getTime() / 1000)
                }
            ]
        };
    }

    private getSlackColor(severity: string): string {
        switch (severity) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'warning';
            case 'low': return 'good';
            case 'info': return 'good';
            default: return '#439FE0';
        }
    }
}

class SMSNotificationProvider extends NotificationProvider {
    private twilioConfig: {
        accountSid: string;
        authToken: string;
        fromNumber: string;
    };

    constructor() {
        super();
        this.twilioConfig = {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken: process.env.TWILIO_AUTH_TOKEN || '',
            fromNumber: process.env.TWILIO_PHONE_NUMBER || ''
        };
    }

    async send(alert: Alert, recipients: string[]): Promise<NotificationResult> {
        try {
            if (!this.twilioConfig.accountSid || !this.twilioConfig.authToken) {
                throw new Error('Twilio configuration not complete');
            }

            const smsMessage = this.buildSMSMessage(alert);
            const sentMessages: string[] = [];

            // In a real implementation, you would use Twilio SDK
            // For now, we'll simulate SMS sending

            for (const phoneNumber of recipients) {
                logger.info('SMS notification prepared', {
                    component: 'notifications',
                    operation: 'sms_send',
                    metadata: {
                        alert_id: alert.id,
                        phone_number: phoneNumber.replace(/\d(?=\d{4})/g, '*') // Mask phone number
                    }
                });

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 100));

                // In production, you would:
                // const client = twilio(this.twilioConfig.accountSid, this.twilioConfig.authToken);
                // await client.messages.create({
                //     body: smsMessage,
                //     from: this.twilioConfig.fromNumber,
                //     to: phoneNumber
                // });

                sentMessages.push(phoneNumber);
            }

            return {
                success: true,
                metadata: {
                    messages_sent: sentMessages.length
                }
            };
        } catch (error) {
            logger.error('Failed to send SMS notification', error instanceof Error ? error : new Error(String(error)), {
                component: 'notifications',
                operation: 'sms_send_error',
                metadata: {
                    alert_id: alert.id,
                    recipients_count: recipients.length
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private buildSMSMessage(alert: Alert): string {
        // SMS messages should be concise due to length limits
        const emoji = this.getSeverityEmoji(alert.severity);
        return `${emoji} FAIRGO ALERT: ${alert.ruleName} - ${alert.message}. Value: ${alert.value}, Threshold: ${alert.threshold}. ID: ${alert.id.slice(0, 8)}`;
    }
}

class WebhookNotificationProvider extends NotificationProvider {
    private defaultWebhookUrl: string;
    private timeout: number;

    constructor() {
        super();
        this.defaultWebhookUrl = process.env.WEBHOOK_ALERT_URL || '';
        this.timeout = parseInt(process.env.WEBHOOK_TIMEOUT || '5000');
    }

    async send(alert: Alert, recipients: string[]): Promise<NotificationResult> {
        try {
            // Recipients for webhooks are typically URLs, use default if none provided
            const webhookUrls = recipients.length > 0 ? recipients : [this.defaultWebhookUrl];

            if (!webhookUrls[0]) {
                throw new Error('No webhook URL configured');
            }

            const payload = this.buildWebhookPayload(alert);
            const sentWebhooks: string[] = [];

            for (const url of webhookUrls) {
                if (!url) continue;

                logger.info('Webhook notification prepared', {
                    component: 'notifications',
                    operation: 'webhook_send',
                    metadata: {
                        alert_id: alert.id,
                        webhook_url: url.replace(/\/\/.*@/, '//***@') // Mask auth info
                    }
                });

                // Simulate HTTP request
                await new Promise(resolve => setTimeout(resolve, 150));

                // In production, you would:
                // const response = await fetch(url, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'User-Agent': 'FairGo-Alerts/1.0'
                //     },
                //     body: JSON.stringify(payload),
                //     signal: AbortSignal.timeout(this.timeout)
                // });

                sentWebhooks.push(url);
            }

            return {
                success: true,
                metadata: {
                    webhooks_sent: sentWebhooks.length
                }
            };
        } catch (error) {
            logger.error('Failed to send webhook notification', error instanceof Error ? error : new Error(String(error)), {
                component: 'notifications',
                operation: 'webhook_send_error',
                metadata: {
                    alert_id: alert.id,
                    recipients_count: recipients.length
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private buildWebhookPayload(alert: Alert) {
        return {
            alertId: alert.id,
            ruleId: alert.ruleId,
            ruleName: alert.ruleName,
            severity: alert.severity,
            status: alert.status,
            message: alert.message,
            description: alert.description,
            value: alert.value,
            threshold: alert.threshold,
            labels: alert.labels,
            annotations: alert.annotations,
            firedAt: alert.firedAt,
            context: alert.context,
            source: 'fairgo-monitoring',
            version: '1.0',
            timestamp: new Date().toISOString()
        };
    }
}

class PagerDutyNotificationProvider extends NotificationProvider {
    private integrationKey: string;
    private apiUrl: string;

    constructor() {
        super();
        this.integrationKey = process.env.PAGERDUTY_INTEGRATION_KEY || '';
        this.apiUrl = 'https://events.pagerduty.com/v2/enqueue';
    }

    async send(alert: Alert, recipients: string[]): Promise<NotificationResult> {
        try {
            if (!this.integrationKey) {
                throw new Error('PagerDuty integration key not configured');
            }

            const payload = this.buildPagerDutyPayload(alert);

            logger.info('PagerDuty notification prepared', {
                component: 'notifications',
                operation: 'pagerduty_send',
                metadata: {
                    alert_id: alert.id,
                    event_action: payload.event_action,
                    integration_key_configured: !!this.integrationKey
                }
            });

            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 200));

            // In production, you would:
            // const response = await fetch(this.apiUrl, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-Routing-Key': this.integrationKey
            //     },
            //     body: JSON.stringify(payload)
            // });

            return {
                success: true,
                metadata: {
                    event_action: payload.event_action
                }
            };
        } catch (error) {
            logger.error('Failed to send PagerDuty notification', error instanceof Error ? error : new Error(String(error)), {
                component: 'notifications',
                operation: 'pagerduty_send_error',
                metadata: {
                    alert_id: alert.id
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private buildPagerDutyPayload(alert: Alert) {
        return {
            routing_key: this.integrationKey,
            event_action: alert.status === 'resolved' ? 'resolve' : 'trigger',
            dedup_key: alert.id,
            payload: {
                summary: `${alert.severity.toUpperCase()}: ${alert.ruleName}`,
                source: alert.labels.service || 'fairgo-platform',
                severity: this.mapSeverityToPagerDuty(alert.severity),
                component: alert.labels.component || 'monitoring',
                group: alert.labels.type || 'alerts',
                class: alert.labels.service || 'fairgo',
                custom_details: {
                    message: alert.message,
                    description: alert.description,
                    current_value: alert.value,
                    threshold: alert.threshold,
                    fired_at: alert.firedAt,
                    alert_id: alert.id,
                    labels: alert.labels,
                    annotations: alert.annotations
                }
            },
            client: 'FairGo Monitoring System',
            client_url: process.env.FAIRGO_DASHBOARD_URL || 'https://fairgo.app/dashboard'
        };
    }

    private mapSeverityToPagerDuty(severity: string): string {
        switch (severity) {
            case 'critical': return 'critical';
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'info';
            case 'info': return 'info';
            default: return 'info';
        }
    }
}

// Factory function to create notification providers
export function createNotificationProvider(channel: string): NotificationProvider | null {
    switch (channel) {
        case 'email':
            return new EmailNotificationProvider();
        case 'slack':
            return new SlackNotificationProvider();
        case 'sms':
            return new SMSNotificationProvider();
        case 'webhook':
            return new WebhookNotificationProvider();
        case 'pagerduty':
            return new PagerDutyNotificationProvider();
        default:
            logger.warning('Unknown notification channel requested', {
                component: 'notifications',
                metadata: { channel }
            });
            return null;
    }
}

export {
    EmailNotificationProvider,
    SlackNotificationProvider,
    SMSNotificationProvider,
    WebhookNotificationProvider,
    PagerDutyNotificationProvider
};