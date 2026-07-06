import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getApprovals, updateApproval } from '../services/ServiceGateway';
import { getAdvisoryRecommendations } from '../lib/oracles/advisoryOracle';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import StateBadge from '../components/StateBadge';

export default function Approvals() {
  const { t } = useLang();
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advisoryMsg, setAdvisoryMsg] = useState(null);
  
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
  }, []);

  const handleAction = async (id, status) => {
    try {
      await updateApproval(id, { status, resolvedAt: new Date().toISOString(), resolvedBy: currentUser.email });
      loadApprovals();
    } catch(err) {
      console.error('Approval failed', err);
    }
  };

  const checkOracle = async (approval) => {
    setAdvisoryMsg('Loading AI advice...');
    try {
      const contextType = approval.module === 'HR' ? 'hr_employee' : 'finance_invoice';
      const data = await getAdvisoryRecommendations(contextType, { total: approval.amount || 0, complianceProfile: 'ethiopia_primary', tin: '' });
      if (data.suggestions && data.suggestions.length > 0) {
        setAdvisoryMsg(data.suggestions[0].message);
      } else {
        setAdvisoryMsg('No specific statutory flags detected for this request.');
      }
    } catch(err) {
      setAdvisoryMsg('Failed to reach advisory oracle.');
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
          </div>
          <button onClick={() => setAdvisoryMsg(null)} className="text-xs font-semibold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Dismiss</button>
        </div>
      )}

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
                          onClick={() => handleAction(req.id, 'approved')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition duration-150"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'rejected')}
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
