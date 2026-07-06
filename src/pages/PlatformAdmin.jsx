import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { useLang } from '../context/LangContext';
import { listRegistryModuleIds } from '../lib/moduleRegistry';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';

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

      await setDoc(doc(db, 'tenants', cleanTenantId), {
        name: tenantName.trim(),
        ceoEmail: ceoEmail.trim(),
        tier: Number(planTier),
        complianceProfile: 'ethiopia_primary',
        createdAt: new Date().toISOString(),
      });

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

  const columns = [
    { key: 'id', header: 'ID', className: 'font-mono font-semibold text-violet-600 dark:text-violet-400' },
    { key: 'name', header: 'Name' },
    { key: 'ceoEmail', header: 'CEO Email' },
    { key: 'tier', header: 'Tier', render: (r) => {
      const stateMap = {
        1: 'posted',
        2: 'waiting',
        3: 'neutral'
      };
      return <StateBadge state={stateMap[r.tier] || 'neutral'} label={`Tier ${r.tier}`} />;
    }},
    { key: 'complianceProfile', header: 'Compliance Profile', className: 'font-mono text-xs capitalize', render: (r) => r.complianceProfile?.replace('_', ' ') || 'ethiopia primary' },
  ];

  return (
    <section>
      <PageHeader
        title={t('platformAdmin')}
        subtitle="Configure global tenants and SaaS plan configurations."
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PageCard>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('tenantProvisioning')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tenant ID (unique slug)</label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                  placeholder="e.g. addis-corp"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('tenantName')}</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  placeholder="e.g. Addis Corporation"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('ceoEmail')}</label>
                <input
                  type="email"
                  value={ceoEmail}
                  onChange={e => setCeoEmail(e.target.value)}
                  placeholder="ceo@addiscorp.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('planTier')}</label>
                <select
                  value={planTier}
                  onChange={e => handleTierChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                >
                  <option value="3">Tier 3 (Starter)</option>
                  <option value="2">Tier 2 (Pro)</option>
                  <option value="1">Tier 1 (Enterprise)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('modules')}</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-2 bg-white dark:bg-gray-900">
                  {modulesList.map(modId => (
                    <label key={modId} className="flex items-center space-x-2 cursor-pointer select-none">
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
                className="btn-primary w-full"
              >
                {submitting ? t('saving') : t('createTenant')}
              </button>
            </form>
          </PageCard>
        </div>

        <div className="lg:col-span-2">
          <PageCard>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Active Tenants</h2>
            <DataTable
              columns={columns}
              rows={tenants}
              rowKey="id"
              loading={loading}
              emptyTitle={t('noTenantsFound')}
              emptyIcon="🏢"
            />
          </PageCard>
        </div>
      </div>
    </section>
  );
}
