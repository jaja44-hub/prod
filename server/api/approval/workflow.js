/**
 * Approval Workflow Engine
 * Handles multi-stage approval workflows for various business processes
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Create a new approval workflow configuration
 */
async function createWorkflowConfiguration(tenantId, workflowConfig) {
  const {
    workflow_type,
    workflow_name,
    description,
    total_stages = 1,
    auto_approve_under_amount = null,
    require_attachment = false,
    require_budget_check = true
  } = workflowConfig;

  const query = `
    INSERT INTO approval_workflow_configurations 
    (tenant_id, workflow_type, workflow_name, description, total_stages, 
     auto_approve_under_amount, require_attachment, require_budget_check)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    tenantId,
    workflow_type,
    workflow_name,
    description,
    total_stages,
    auto_approve_under_amount,
    require_attachment,
    require_budget_check
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating workflow configuration:', error);
    throw error;
  }
}

/**
 * Add stages to a workflow configuration
 */
async function addWorkflowStages(configurationId, stages) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const stage of stages) {
      const query = `
        INSERT INTO approval_workflow_stages 
        (configuration_id, stage_number, stage_name, approval_role, 
         approver_id, approval_required, can_delegate, timeout_hours, auto_approve)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        configurationId,
        stage.stage_number,
        stage.stage_name,
        stage.approval_role,
        stage.approver_id || null,
        stage.approval_required !== false,
        stage.can_delegate !== false,
        stage.timeout_hours || 72,
        stage.auto_approve || false
      ];
      
      await client.query(query, values);
    }
    
    await client.query('COMMIT');
    return { success: true, message: 'Workflow stages added successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding workflow stages:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Start a new approval workflow instance
 */
async function startWorkflowInstance(tenantId, workflowData) {
  const {
    workflow_type,
    reference_type,
    reference_id,
    initiator_id,
    initiator_name,
    amount,
    currency = 'ETB',
    description
  } = workflowData;

  // Get workflow configuration
  const configQuery = `
    SELECT * FROM approval_workflow_configurations 
    WHERE tenant_id = $1 AND workflow_type = $2 AND active = true
  `;
  
  const configResult = await pool.query(configQuery, [tenantId, workflow_type]);
  
  if (configResult.rows.length === 0) {
    throw new Error(`No active workflow configuration found for type: ${workflow_type}`);
  }
  
  const configuration = configResult.rows[0];
  
  // Check for auto-approval
  if (configuration.auto_approve_under_amount && amount && amount <= configuration.auto_approve_under_amount) {
    return await autoApproveWorkflow(tenantId, configuration, workflowData);
  }
  
  // Create workflow instance
  const instanceQuery = `
    INSERT INTO approval_workflow_instances 
    (tenant_id, configuration_id, workflow_type, reference_type, reference_id, 
     current_stage, status, initiator_id, initiator_name, amount, currency, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  
  const instanceValues = [
    tenantId,
    configuration.id,
    workflow_type,
    reference_type,
    reference_id,
    1,
    'pending',
    initiator_id,
    initiator_name,
    amount,
    currency,
    description
  ];
  
  try {
    const instanceResult = await pool.query(instanceQuery, instanceValues);
    const instance = instanceResult.rows[0];
    
    // Log the initiation
    await logWorkflowAction(instance.id, 1, 'initiated', initiator_id, initiator_name, 'Workflow initiated');
    
    return instance;
  } catch (error) {
    console.error('Error starting workflow instance:', error);
    throw error;
  }
}

/**
 * Auto-approve a workflow (for amounts under threshold)
 */
async function autoApproveWorkflow(tenantId, configuration, workflowData) {
  const instanceQuery = `
    INSERT INTO approval_workflow_instances 
    (tenant_id, configuration_id, workflow_type, reference_type, reference_id, 
     current_stage, status, initiator_id, initiator_name, amount, currency, description, 
     completed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  
  const instanceValues = [
    tenantId,
    configuration.id,
    workflowData.workflow_type,
    workflowData.reference_type,
    workflowData.reference_id,
    configuration.total_stages,
    'approved',
    workflowData.initiator_id,
    workflowData.initiator_name,
    workflowData.amount,
    workflowData.currency,
    workflowData.description,
    new Date()
  ];
  
  try {
    const instanceResult = await pool.query(instanceQuery, instanceValues);
    const instance = instanceResult.rows[0];
    
    // Log auto-approval
    await logWorkflowAction(instance.id, configuration.total_stages, 'auto_approved', 
                          workflowData.initiator_id, workflowData.initiator_name, 
                          'Auto-approved: amount under threshold');
    
    return instance;
  } catch (error) {
    console.error('Error auto-approving workflow:', error);
    throw error;
  }
}

/**
 * Approve a workflow stage
 */
async function approveWorkflowStage(instanceId, approverData) {
  const {
    actor_id,
    actor_name,
    actor_role,
    comments = null,
    attachment_url = null
  } = approverData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current instance
    const instanceQuery = `
      SELECT * FROM approval_workflow_instances 
      WHERE id = $1 FOR UPDATE
    `;
    const instanceResult = await client.query(instanceQuery, [instanceId]);
    
    if (instanceResult.rows.length === 0) {
      throw new Error('Workflow instance not found');
    }
    
    const instance = instanceResult.rows[0];
    
    if (instance.status !== 'pending') {
      throw new Error(`Workflow is not pending (current status: ${instance.status})`);
    }
    
    // Get current stage configuration
    const stageQuery = `
      SELECT * FROM approval_workflow_stages 
      WHERE configuration_id = $1 AND stage_number = $2
    `;
    const stageResult = await client.query(stageQuery, [instance.configuration_id, instance.current_stage]);
    
    if (stageResult.rows.length === 0) {
      throw new Error('Stage configuration not found');
    }
    
    const stage = stageResult.rows[0];
    
    // Log approval action
    await logWorkflowAction(instanceId, instance.current_stage, 'approved', 
                          actor_id, actor_name, comments, attachment_url, actor_role);
    
    // Check if this is the last stage
    const totalStagesQuery = `
      SELECT COUNT(*) as count FROM approval_workflow_stages 
      WHERE configuration_id = $1
    `;
    const totalStagesResult = await client.query(totalStagesQuery, [instance.configuration_id]);
    const totalStages = parseInt(totalStagesResult.rows[0].count);
    
    if (instance.current_stage >= totalStages) {
      // Complete the workflow
      const completeQuery = `
        UPDATE approval_workflow_instances 
        SET status = 'approved', current_stage = current_stage + 1, completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const completeResult = await client.query(completeQuery, [instanceId]);
      await client.query('COMMIT');
      return completeResult.rows[0];
    } else {
      // Move to next stage
      const nextStageQuery = `
        UPDATE approval_workflow_instances 
        SET current_stage = current_stage + 1
        WHERE id = $1
        RETURNING *
      `;
      const nextStageResult = await client.query(nextStageQuery, [instanceId]);
      await client.query('COMMIT');
      return nextStageResult.rows[0];
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving workflow stage:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reject a workflow
 */
async function rejectWorkflow(instanceId, rejectorData) {
  const {
    actor_id,
    actor_name,
    actor_role,
    comments = null,
    attachment_url = null
  } = rejectorData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current instance
    const instanceQuery = `
      SELECT * FROM approval_workflow_instances 
      WHERE id = $1 FOR UPDATE
    `;
    const instanceResult = await client.query(instanceQuery, [instanceId]);
    
    if (instanceResult.rows.length === 0) {
      throw new Error('Workflow instance not found');
    }
    
    const instance = instanceResult.rows[0];
    
    if (instance.status !== 'pending') {
      throw new Error(`Workflow is not pending (current status: ${instance.status})`);
    }
    
    // Log rejection action
    await logWorkflowAction(instance.id, instance.current_stage, 'rejected', 
                          actor_id, actor_name, comments, attachment_url, actor_role);
    
    // Update instance status
    const rejectQuery = `
      UPDATE approval_workflow_instances 
      SET status = 'rejected', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const rejectResult = await client.query(rejectQuery, [instanceId]);
    
    await client.query('COMMIT');
    return rejectResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting workflow:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delegate approval to another user
 */
async function delegateApproval(instanceId, delegationData) {
  const {
    actor_id,
    actor_name,
    delegated_to_id,
    delegated_to_name,
    comments = null
  } = delegationData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current instance
    const instanceQuery = `
      SELECT * FROM approval_workflow_instances 
      WHERE id = $1 FOR UPDATE
    `;
    const instanceResult = await client.query(instanceQuery, [instanceId]);
    
    if (instanceResult.rows.length === 0) {
      throw new Error('Workflow instance not found');
    }
    
    const instance = instanceResult.rows[0];
    
    if (instance.status !== 'pending') {
      throw new Error(`Workflow is not pending (current status: ${instance.status})`);
    }
    
    // Update stage approver
    const updateStageQuery = `
      UPDATE approval_workflow_stages 
      SET approver_id = $1
      WHERE configuration_id = $2 AND stage_number = $3
    `;
    await client.query(updateStageQuery, [delegated_to_id, instance.configuration_id, instance.current_stage]);
    
    // Log delegation action
    await logWorkflowAction(instance.id, instance.current_stage, 'delegated', 
                          actor_id, actor_name, comments, null, null, 
                          delegated_to_id, delegated_to_name);
    
    await client.query('COMMIT');
    return { success: true, message: 'Approval delegated successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error delegating approval:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Log workflow action
 */
async function logWorkflowAction(instanceId, stageNumber, actionType, actorId, actorName, 
                                 comments = null, attachmentUrl = null, actorRole = null,
                                 delegatedFromId = null, delegatedFromName = null) {
  const query = `
    INSERT INTO approval_workflow_actions 
    (instance_id, stage_number, action_type, actor_id, actor_name, actor_role, 
     comments, attachment_url, delegated_from_id, delegated_from_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const values = [
    instanceId,
    stageNumber,
    actionType,
    actorId,
    actorName,
    actorRole,
    comments,
    attachmentUrl,
    delegatedFromId,
    delegatedFromName
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging workflow action:', error);
    throw error;
  }
}

/**
 * Get workflow instance status
 */
async function getWorkflowStatus(instanceId) {
  const query = `
    SELECT 
      wi.*,
      wc.workflow_name,
      wc.total_stages,
      ws.stage_name,
      ws.approval_role,
      ws.approver_id,
      ws.timeout_hours
    FROM approval_workflow_instances wi
    LEFT JOIN approval_workflow_configurations wc ON wi.configuration_id = wc.id
    LEFT JOIN approval_workflow_stages ws ON wi.configuration_id = ws.configuration_id 
      AND wi.current_stage = ws.stage_number
    WHERE wi.id = $1
  `;
  
  try {
    const result = await pool.query(query, [instanceId]);
    
    if (result.rows.length === 0) {
      throw new Error('Workflow instance not found');
    }
    
    // Get action history
    const actionsQuery = `
      SELECT * FROM approval_workflow_actions 
      WHERE instance_id = $1 
      ORDER BY action_timestamp ASC
    `;
    const actionsResult = await pool.query(actionsQuery, [instanceId]);
    
    return {
      instance: result.rows[0],
      actions: actionsResult.rows
    };
  } catch (error) {
    console.error('Error getting workflow status:', error);
    throw error;
  }
}

/**
 * Get pending workflows for a user
 */
async function getPendingWorkflows(tenantId, userId) {
  const query = `
    SELECT 
      wi.*,
      wc.workflow_name,
      ws.stage_name,
      ws.approval_role
    FROM approval_workflow_instances wi
    JOIN approval_workflow_configurations wc ON wi.configuration_id = wc.id
    JOIN approval_workflow_stages ws ON wi.configuration_id = ws.configuration_id 
      AND wi.current_stage = ws.stage_number
    WHERE wi.tenant_id = $1 
      AND wi.status = 'pending'
      AND (ws.approver_id = $2 OR ws.approver_id IS NULL)
    ORDER BY wi.started_at ASC
  `;
  
  try {
    const result = await pool.query(query, [tenantId, userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting pending workflows:', error);
    throw error;
  }
}

/**
 * Get workflow configuration by type
 */
async function getWorkflowConfiguration(tenantId, workflowType) {
  const query = `
    SELECT 
      wc.*,
      json_agg(
        json_build_object(
          'stage_number', s.stage_number,
          'stage_name', s.stage_name,
          'approval_role', s.approval_role,
          'approver_id', s.approver_id,
          'approval_required', s.approval_required,
          'can_delegate', s.can_delegate,
          'timeout_hours', s.timeout_hours,
          'auto_approve', s.auto_approve
        ) ORDER BY s.stage_number
      ) as stages
    FROM approval_workflow_configurations wc
    LEFT JOIN approval_workflow_stages s ON wc.id = s.configuration_id
    WHERE wc.tenant_id = $1 AND wc.workflow_type = $2 AND wc.active = true
    GROUP BY wc.id
  `;
  
  try {
    const result = await pool.query(query, [tenantId, workflowType]);
    
    if (result.rows.length === 0) {
      throw new Error('Workflow configuration not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting workflow configuration:', error);
    throw error;
  }
}

module.exports = {
  createWorkflowConfiguration,
  addWorkflowStages,
  startWorkflowInstance,
  approveWorkflowStage,
  rejectWorkflow,
  delegateApproval,
  getWorkflowStatus,
  getPendingWorkflows,
  getWorkflowConfiguration
};
