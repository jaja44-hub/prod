/**
 * src/pages/WarehouseDashboard.jsx
 * Warehouse dashboard component integrating pick/pack/ship workflow APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../../api/client.js';

export function WarehouseDashboard() {
  const [workflowData, setWorkflowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = getApiClient();

        // Fetch warehouse workflow data
        const workflow = await client.warehouse('workflow');
        setWorkflowData(workflow);
      } catch (err) {
        setError(err.message || 'Failed to load warehouse data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="warehouse-dashboard loading">Loading warehouse data...</div>;
  if (error) return <div className="warehouse-dashboard error">Error: {error}</div>;

  return (
    <div className="warehouse-dashboard">
      <h1>Warehouse Management</h1>

      {workflowData && (
        <div className="workflow-section">
          <h2>Pick/Pack/Ship Workflow</h2>
          <div className="workflow-metrics">
            <div className="metric">
              <label>Total Orders:</label>
              <span>{workflowData.report?.summary?.totalOrders || 0}</span>
            </div>
            <div className="metric">
              <label>Picking:</label>
              <span>{workflowData.report?.summary?.pickingCount || 0}</span>
            </div>
            <div className="metric">
              <label>Packing:</label>
              <span>{workflowData.report?.summary?.packingCount || 0}</span>
            </div>
            <div className="metric">
              <label>Shipped:</label>
              <span>{workflowData.report?.summary?.shippedCount || 0}</span>
            </div>
          </div>

          <div className="workflow-stages">
            <h3>Shipments by Status</h3>
            <div className="stage-columns">
              {workflowData.report?.workflow &&
                Object.entries(
                  workflowData.report.workflow.reduce((stages, item) => {
                    (stages[item.status] = stages[item.status] || []).push(item);
                    return stages;
                  }, {})
                ).map(([status, items]) => (
                  <div key={status} className="stage-column">
                    <h4>{status}</h4>
                    <div className="shipment-cards">
                      {items.map((item) => (
                        <div key={item.id} className="shipment-card">
                          <p className="order-id">Order: {item.orderId}</p>
                          <p className="sku">SKU: {item.sku}</p>
                          <p className="qty">Qty: {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="shipments-table">
            <h3>Recent Shipments</h3>
            <table>
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Carrier</th>
                  <th>Tracking</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workflowData.report?.shipments &&
                  workflowData.report.shipments.slice(0, 15).map((shipment) => (
                    <tr key={shipment.id}>
                      <td>{shipment.shipmentId}</td>
                      <td>{shipment.carrier}</td>
                      <td>{shipment.trackingNumber}</td>
                      <td>{shipment.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="inventory-timeline">
            <h3>Inventory Movements</h3>
            <div className="timeline">
              {workflowData.report?.movements &&
                workflowData.report.movements.slice(0, 25).map((movement, idx) => (
                  <div key={idx} className="timeline-item">
                    <span className="timestamp">{movement.timestamp}</span>
                    <span className="type">{movement.type}</span>
                    <span className="location">{movement.location}</span>
                    <span className="quantity">x{movement.quantity}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WarehouseDashboard;
