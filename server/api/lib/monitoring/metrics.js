/**
 * api/monitoring/metrics.js
 * APM and performance metrics collection
 */

const metricsData = {
  endpoints: {},
  startTime: Date.now(),
};

export class MetricsCollector {
  constructor(serviceName = 'api') {
    this.serviceName = serviceName;
  }

  recordEndpointCall(endpoint, duration, statusCode, method = 'GET') {
    const key = `${method} ${endpoint}`;

    if (!metricsData.endpoints[key]) {
      metricsData.endpoints[key] = {
        calls: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        statusCodes: {},
        lastCall: null,
      };
    }

    const metric = metricsData.endpoints[key];
    metric.calls++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.calls;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.statusCodes[statusCode] = (metric.statusCodes[statusCode] || 0) + 1;
    metric.lastCall = new Date().toISOString();
  }

  getEndpointMetrics(endpoint = null) {
    if (endpoint) {
      return metricsData.endpoints[endpoint];
    }

    return metricsData.endpoints;
  }

  getHealthMetrics() {
    const uptime = Date.now() - metricsData.startTime;
    const totalCalls = Object.values(metricsData.endpoints).reduce((sum, m) => sum + m.calls, 0);
    const avgResponseTime =
      Object.values(metricsData.endpoints).reduce((sum, m) => sum + m.avgDuration, 0) /
        Object.keys(metricsData.endpoints).length || 0;

    // Calculate error rate
    let errorCalls = 0;
    Object.values(metricsData.endpoints).forEach((metric) => {
      errorCalls += (metric.statusCodes['500'] || 0) + (metric.statusCodes['429'] || 0);
    });

    const errorRate = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0;

    return {
      status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
      uptime,
      totalCalls,
      avgResponseTime: avgResponseTime.toFixed(2),
      errorRate: errorRate.toFixed(2),
      endpoints: Object.keys(metricsData.endpoints).length,
    };
  }
}

export const globalMetricsCollector = new MetricsCollector('production-erp');
