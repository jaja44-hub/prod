/**
 * Vercel Cron Job — Hugging Face Keep-Alive
 * Configured in vercel.json to run every 24 hours.
 * Prevents the Hugging Face Docker container from sleeping.
 */
export default async function handler(req, res) {
  // Vercel cron jobs send GET requests with an Authorization header
  // Protect this endpoint from external abuse
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const odooUrl = process.env.ODOO_URL;
    if (!odooUrl) throw new Error("ODOO_URL is not set.");

    // Ping the Odoo health check endpoint
    const response = await fetch(`${odooUrl}/web/health`);
    const timestamp = new Date().toISOString();

    if (response.ok) {
      console.log(`[Keep-Alive] ✅ Odoo is awake at ${timestamp}`);
      return res.status(200).json({
        success: true,
        message: `Odoo pinged successfully at ${timestamp}`,
        status: response.status
      });
    } else {
      console.warn(`[Keep-Alive] ⚠️ Odoo returned status ${response.status} at ${timestamp}`);
      return res.status(200).json({
        success: false,
        message: `Odoo returned unexpected status: ${response.status}`
      });
    }
  } catch (error) {
    console.error('[Keep-Alive Error]', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
