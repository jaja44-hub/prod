import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getApprovals, updateApproval, createApproval } from '../services/ServiceGateway';
import { getAdvisoryRecommendations } from '../lib/oracles/advisoryOracle';

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
      // Mock passing the approval payload to the oracle
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
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Command Approvals Bridge</h1>
      <p className="text-gray-600 mb-6">Review cross-module administrative override requests.</p>
      
      {advisoryMsg && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded shadow-sm">
          <strong>Oracle Advisory:</strong> {advisoryMsg}
          <button onClick={() => setAdvisoryMsg(null)} className="ml-4 text-sm underline text-indigo-600">Dismiss</button>
        </div>
      )}

      {loading ? (
        <p>Loading approvals...</p>
      ) : approvals.length === 0 ? (
        <p className="text-gray-500">No pending approvals found in the queue.</p>
      ) : (
        <div className="space-y-4">
          {approvals.map(req => (
            <div key={req.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{req.title || 'Untitled Request'}</h3>
                <p className="text-sm text-gray-500 mb-2">Module: {req.module} | Requester: {req.requestedBy}</p>
                <div className="text-sm">{req.description}</div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-2 py-1 text-xs font-bold rounded ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {req.status.toUpperCase()}
                </span>
                {req.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => checkOracle(req)} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded hover:bg-indigo-200 transition">
                      Consult Oracle
                    </button>
                    <button onClick={() => handleAction(req.id, 'approved')} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition">
                      Approve
                    </button>
                    <button onClick={() => handleAction(req.id, 'rejected')} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
