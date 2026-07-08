import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getApprovals, updateApproval, getAuditLog, logAuditEvent } from '../services/ServiceGateway';
import LogicServiceGateway from '../services/LogicServiceGateway';
import { buildExternalServicePosture } from '../lib/externalServicesDepth';
import { buildApprovalLogicContext } from '../lib/approvalLogicContext';
import { getActiveTenant } from '../services/ServiceGateway';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import StateBadge from '../components/StateBadge';

export default function Approvals() {
  const { t } = useLang();
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advisoryMsg, setAdvisoryMsg] = useState(null);
  const [settlementPreview, setSettlementPreview] = useState(null);
  const [externalPosture, setExternalPosture] = useState(() => buildExternalServicePosture());
  
  const refreshExternalPosture = async (settlementData = null, advisoryAvailable = true) => {
    try {
      const auditEntries = await getAuditLog(20);
      setExternalPosture(buildExternalServicePosture({
        advisory: { available: advisoryAvailable, confidence: advisoryAvailable ? 0.84 : 0.1, suggestions: advisoryAvailable ? [{ type: 'warning' }] : [] },
        settlement: settlementData,
        auditEntries,
      }));
    } catch {
      setExternalPosture(buildExternalServicePosture({
        advisory: { available: advisoryAvailable, confidence: advisoryAvailable ? 0.84 : 0.1, suggestions: [] },
        settlement: settlementData,
        auditEntries: [],
      }));
    }
  };
  
  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await getApprovals();
      setApprovals(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    refreshExternalPosture();
  }, []);

  const handleAction = async (approval, status) => {
    try {
      await updateApproval(approval.id, { status, resolvedAt: new Date().toISOString(), resolvedBy: currentUser?.email || 'system' });
      const tenantId = getActiveTenant?.() || 'production';
      const flowContext = buildApprovalLogicContext(approval, tenantId);
      const settlementData = approval.amount ? await LogicServiceGateway.getSettlementDecision(flowContext.settlement) : null;
      setSettlementPreview(settlementData);
      await logAuditEvent({
        entityType: 'admin_approval',
        entityId: approval.id,
        action: status,
        module: approval.module || 'Unknown',
        detail: `Approval ${status} for ${approval.title || approval.id}`,
        actor: currentUser?.email || 'system',
      });
      await refreshExternalPosture(settlementData, true);
      loadApprovals();
    } catch(err) {
      console.error('Approval failed', err);
    }
  };

  const checkOracle = async (approval) => {
    setAdvisoryMsg('Loading AI advice...');
    try {
      const tenantId = getActiveTenant?.() || 'production';
      const flowContext = buildApprovalLogicContext(approval, tenantId);
      const settlementData = approval.amount ? await LogicServiceGateway.getSettlementDecision(flowContext.settlement) : null;
      setSettlementPreview(settlementData);
      const data = await LogicServiceGateway.getAdvisoryDecision(flowContext.advisory);
      if (data.suggestions && data.suggestions.length > 0) {
        setAdvisoryMsg(data.suggestions[0].message);
      } else {
        setAdvisoryMsg('No specific statutory flags detected for this request.');
      }
      await logAuditEvent({
        entityType: 'admin_approval',
        entityId: approval.id,
        action: 'consulted_oracle',
        module: approval.module || 'Unknown',
        detail: `Oracle consultation for ${approval.title || approval.id}`,
        actor: currentUser?.email || 'system',
      });
      await refreshExternalPosture(settlementData, true);
    } catch(err) {
      setAdvisoryMsg('Failed to reach advisory oracle.');
      await refreshExternalPosture(null, false);
    }
  };

  return (
    <section className="max-w-5xl">
      <PageHeader
        title="Command Approvals Bridge"
        subtitle="Review cross-module administrative override requests."
      />
      
      {advisoryMsg && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl shadow-sm flex items-start justify-between dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-300">
          <div>
            <strong className="text-xs uppercase tracking-wide block mb-1">Oracle Advisory</strong>
            <p className="text-sm">{advisoryMsg}</p>
            {settlementPreview && (
              <p className="text-xs mt-2 font-medium">
                Settlement preview: subtotal {settlementPreview.subtotal} ETB, VAT {settlementPreview.vatAmount} ETB, grand total {settlementPreview.grandTotal} ETB.
              </p>
            )}
          </div>
          <button onClick={() => setAdvisoryMsg(null)} className="text-xs font-semibold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Dismiss</button>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <PageCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">External service posture</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{externalPosture.summary}</p>
            </div>
            <StateBadge state={externalPosture.status === 'operational' ? 'posted' : externalPosture.status === 'watch' ? 'waiting' : 'danger'} label={externalPosture.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 ${externalPosture.advisoryReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>Advisory {externalPosture.advisoryReady ? 'ready' : 'degraded'}</span>
            <span className={`rounded-full px-2.5 py-1 ${externalPosture.settlementReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>Settlement {externalPosture.settlementReady ? 'ready' : 'pending'}</span>
            <span className={`rounded-full px-2.5 py-1 ${externalPosture.governanceHealthy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>Governance {externalPosture.governanceHealthy ? 'healthy' : 'needs review'}</span>
          </div>
        </PageCard>
        <PageCard>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Governance trail</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Audit events captured: {externalPosture.auditCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Each advisory consult and approval action now leaves a traceable record for compliance review.</p>
        </PageCard>
      </div>

      {loading ? (
        <PageCard>
          <div className="text-center py-10 text-gray-500">Loading approvals...</div>
        </PageCard>
      ) : approvals.length === 0 ? (
        <PageCard>
          <div className="text-center py-10 text-gray-500">No pending approvals found in the queue.</div>
        </PageCard>
      ) : (
        <div className="space-y-4">
          {approvals.map(req => {
            const stateMap = {
              pending: 'waiting',
              approved: 'posted',
              rejected: 'danger'
            };
            return (
              <PageCard key={req.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white">{req.title || 'Untitled Request'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Module: <span className="font-medium text-gray-700 dark:text-gray-300">{req.module}</span> | Requester: <span className="font-medium text-gray-700 dark:text-gray-300">{req.requestedBy}</span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pt-1">{req.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end justify-center self-start sm:self-center">
                    <StateBadge state={stateMap[req.status] || 'neutral'} label={req.status} />
                    {req.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => checkOracle(req)}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          Consult Oracle
                        </button>
                        <button
                          onClick={() => handleAction(req, 'approved')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition duration-150"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req, 'rejected')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition duration-150"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </PageCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
