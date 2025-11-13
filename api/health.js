/**
 * Health Check API
 * Returns service status and database connectivity
 *
 * SECURITY: No authentication required (public health check)
 * USAGE: Monitoring, uptime checks, load balancer health probes
 */

const pool = require('../lib/db-pool');

module.exports = async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Test database connection
    await pool.query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;

    // Return healthy status
    return res.status(200).json({
      status: 'healthy',
      service: 'the-london-sudoku',
      version: process.env.APP_VERSION || '0.1.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          responseTimeMs: dbResponseTime
        }
      },
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    // Database connection failed

    return res.status(503).json({
      status: 'unhealthy',
      service: 'the-london-sudoku',
      version: process.env.APP_VERSION || '0.1.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'unhealthy',
          error: 'Connection failed'
        }
      },
      environment: process.env.NODE_ENV || 'development'
    });
  }
};
