/**
 * api/crm-activity.js
 * Mock data handler for CRM activity (Vercel serverless compatible)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Mock CRM activity data
      const mockActivities = [
        {
          id: 1,
          type: 'call',
          description: 'Follow-up call with Safaricom Ethiopia',
          date: '2026-07-11',
          status: 'completed',
          lead_id: 101
        },
        {
          id: 2,
          type: 'email',
          description: 'Sent proposal to Awash Bank HQ',
          date: '2026-07-10',
          status: 'completed',
          lead_id: 102
        },
        {
          id: 3,
          type: 'meeting',
          description: 'Site visit with Oromia Coffee Cooperative',
          date: '2026-07-09',
          status: 'scheduled',
          lead_id: 103
        }
      ];
      
      res.status(200).json({
        success: true,
        data: mockActivities,
        count: mockActivities.length
      });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CRM activity API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
