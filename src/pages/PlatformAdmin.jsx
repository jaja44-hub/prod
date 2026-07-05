import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc, query } from 'firebase/firestore';
import { useLang } from '../context/LangContext';
import { listRegistryModuleIds } from '../lib/moduleRegistry';

export default function PlatformAdmin() {
  const { t } = useLang();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Provisioning Form State
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [ceoEmail, setCeoEmail] = useState('');
  const [planTier, setPlanTier] = useState('3');
  const [selectedModules, setSelectedModules] = useState(['dashboard', 'inventory', 'sales']);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const modulesList = listRegistryModuleIds();

  // Tier presets
  const tierPresets = {
    '1': ['dashboard', 'inventory', 'sales', 'purchase', 'finance'],
    '2': ['dashboard', 'inventory', 'sales', 'purchase'],
    '3': ['dashboard', 'inventory', 'sales'],
  };

  const handleTierChange = (tierVal) => {
    setPlanTier(tierVal);
    if (tierPresets[tierVal]) {
      setSelectedModules(tierPresets[tierVal]);
    }
  };

  const fetchTenants = async () => {
    if (!db) {
      setError('Firestore is not configured.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'tenants'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTenants(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tenants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleModuleToggle = (modId) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId || !tenantName || !ceoEmail) {
      setError('Please fill in all required fields.');
      return;
    }
    
    const cleanTenantId = tenantId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanTenantId) {
      setError('Invalid Tenant ID.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg('');

      // 1. Create or overwrite the tenant document
      await setDoc(doc(db, 'tenants', cleanTenantId), {
        name: tenantName.trim(),
        ceoEmail: ceoEmail.trim(),
        tier: Number(planTier),
        complianceProfile: 'ethiopia_primary',
        createdAt: new Date().toISOString(),
      });

      // 2. Provision selected modules
      for (const modId of modulesList) {
        const isEnabled = selectedModules.includes(modId);
        await setDoc(doc(db, 'tenant_modules', `${cleanTenantId}_${modId}`), {
          tenantId: cleanTenantId,
          moduleId: modId,
          enabled: isEnabled,
          updatedAt: new Date().toISOString(),
        });
      }

      setSuccessMsg(t('provisionSuccess') || 'Tenant provisioned successfully!');
      setTenantId('');
      setTenantName('');
      setCeoEmail('');
      setPlanTier('3');
      setSelectedModules(tierPresets['3']);
      fetchTenants();
    } catch (err) {
      console.error(err);
      setError('Failed to provision tenant.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">{t('platformAdmin')}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">Configure global tenants and SaaS plan configurations.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provision Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 dark:text-gray-200">{t('tenantProvisioning')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1 dark:text-gray-400">Tenant ID (unique slug)</label>
              <input
                type="text"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                placeholder="e.g. addis-corp"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1 dark:text-gray-400">{t('tenantName')}</label>
              <input
                type="text"
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                placeholder="e.g. Addis Corporation"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1 dark:text-gray-400">{t('ceoEmail')}</label>
              <input
                type="email"
                value={ceoEmail}
                onChange={e => setCeoEmail(e.target.value)}
                placeholder="ceo@addiscorp.com"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1 dark:text-gray-400">{t('planTier')}</label>
              <select
                value={planTier}
                onChange={e => handleTierChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="3">Tier 3 (Starter)</option>
                <option value="2">Tier 2 (Pro)</option>
                <option value="1">Tier 1 (Enterprise)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-2 dark:text-gray-400">{t('modules')}</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 dark:border-gray-800">
                {modulesList.map(modId => (
                  <label key={modId} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(modId)}
                      onChange={() => handleModuleToggle(modId)}
                      className="rounded text-violet-600 focus:ring-violet-500 border-slate-300 dark:border-gray-700 dark:bg-gray-850"
                    />
                    <span className="text-sm text-slate-700 dark:text-gray-300 capitalize">{modId}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition disabled:opacity-50"
            >
              {submitting ? t('saving') : t('createTenant')}
            </button>
          </form>
        </div>

        {/* Tenant List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 dark:text-gray-200">Active Tenants</h2>
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading tenants...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-10 text-slate-500">{t('noTenantsFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:border-gray-800">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">CEO Email</th>
                    <th className="pb-3 text-center">Tier</th>
                    <th className="pb-3">Compliance Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {tenants.map(tData => (
                    <tr key={tData.id} className="text-sm text-slate-700 hover:bg-slate-50/50 dark:text-gray-300 dark:hover:bg-gray-800/30">
                      <td className="py-3 font-mono font-semibold text-violet-600 dark:text-violet-400">{tData.id}</td>
                      <td className="py-3">{tData.name}</td>
                      <td className="py-3">{tData.ceoEmail}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tData.tier === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          tData.tier === 2 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          'bg-slate-100 text-slate-850 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          Tier {tData.tier}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs capitalize">{tData.complianceProfile?.replace('_', ' ') || 'ethiopia primary'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
