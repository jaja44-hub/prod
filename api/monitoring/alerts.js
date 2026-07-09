/**
 * api/monitoring/alerts.js
 * Alerting and threshold-based monitoring
 */

export class AlertManager {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      errorRate: 10, // % errors
      responseTime: 5000, // ms
      cpuUsage: 80, // %
      memoryUsage: 85, // %
    };
  }

  checkMetrics(metrics) {
    const alerts = [];

    // Error rate check
    const errorRate = parseFloat(metrics.errorRate);
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        severity: 'warning',
        metric: 'error_rate',
        value: errorRate,
        threshold: this.thresholds.errorRate,
        message: `Error rate ${errorRate.toFixed(2)}% exceeds threshold ${this.thresholds.errorRate}%`,
      });
    }

    // Response time check
    const responseTime = parseFloat(metrics.avgResponseTime);
    if (responseTime > this.thresholds.responseTime) {
      alerts.push({
        severity: 'warning',
        metric: 'response_time',
        value: responseTime,
        threshold: this.thresholds.responseTime,
        message: `Avg response time ${responseTime.toFixed(0)}ms exceeds threshold ${this.thresholds.responseTime}ms`,
      });
    }

    return alerts;
  }

  setThreshold(metric, value) {
    if (metric in this.thresholds) {
      this.thresholds[metric] = value;
    }
  }

  getThresholds() {
    return this.thresholds;
  }
}

export const globalAlertManager = new AlertManager();
