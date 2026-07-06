import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { listRegistryModuleIds, getModuleDef } from '../lib/moduleRegistry';
import { fetchEnabledTenantModules } from '../lib/tenantSchema';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';

export default function TenantSetup() {
  const { t } = useLang();
  const { userProfile } = useAuth();
  const tenantId = userProfile?.tenantId;

  const [orgName, setOrgName] = useState('');
  const [complianceProfile, setComplianceProfile] = useState('ethiopia_primary');
  const [modulesMap, setModulesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const modulesList = listRegistryModuleIds();

  useEffect(() => {
    async function loadTenantConfig() {
      if (!db || !tenantId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setOrgName(data.name || '');
          setComplianceProfile(data.complianceProfile || 'ethiopia_primary');
        }

        const activeMods = await fetchEnabledTenantModules(tenantId);
        const map = {};
        modulesList.forEach(m => {
          map[m] = activeMods ? activeMods.includes(m) : false;
        });
        setModulesMap(map);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load configuration.');
      } finally {
        setLoading(false);
      }
    }

    loadTenantConfig();
  }, [tenantId]);

  const handleModuleToggle = (modId) => {
    setModulesMap(prev => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError('Organization name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const tenantRef = doc(db, 'tenants', tenantId);
      const tenantSnap = await getDoc(tenantRef);
      const existingData = tenantSnap.exists() ? tenantSnap.data() : {};

      await setDoc(tenantRef, {
        ...existingData,
        name: orgName.trim(),
        complianceProfile,
        updatedAt: new Date().toISOString(),
      });

      for (const modId of modulesList) {
        await setDoc(doc(db, 'tenant_modules', `${tenantId}_${modId}`), {
          tenantId,
          moduleId: modId,
          enabled: !!modulesMap[modId],
          updatedAt: new Date().toISOString(),
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-4xl">
      <PageHeader
        title={t('tenantSetup')}
        subtitle="Configure regional compliance profile and module access controls for your organization."
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          Settings saved successfully!
        </div>
      )}

      {loading ? (
        <PageCard>
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading organization settings...
          </div>
        </PageCard>
      ) : (
        <form onSubmit={handleSave}>
          <PageCard className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Organization Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Organization / Tenant Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('complianceProfile')}</label>
                  <select
                    value={complianceProfile}
                    onChange={e => setComplianceProfile(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                  >
                    <option value="ethiopia_primary">{t('ethiopiaPrimary')}</option>
                    <option value="global_flat">{t('globalFlat')}</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-250 dark:border-gray-800" />

            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Available Modules</h2>
              <p className="text-xs text-gray-450 dark:text-gray-500 mb-4">Enable or disable specific modules for users within your tenant organisation.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modulesList.map(modId => {
                  const def = getModuleDef(modId);
                  const isDashboard = modId === 'dashboard';
                  return (
                    <div
                      key={modId}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        modulesMap[modId] 
                          ? 'border-violet-500 bg-violet-50/10' 
                          : 'border-slate-200 bg-slate-50/20 dark:border-gray-800 dark:bg-transparent'
                      }`}
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 capitalize dark:text-gray-205">{modId}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">Required Plan Tier: {def?.minPlanTier || 3}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!modulesMap[modId]}
                        disabled={isDashboard}
                        onChange={() => handleModuleToggle(modId)}
                        className="rounded text-violet-600 focus:ring-violet-500 border-slate-300 dark:border-gray-700 dark:bg-gray-850 disabled:opacity-50"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-750 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? t('saving') : 'Save Configuration'}
              </button>
            </div>
          </PageCard>
        </form>
      )}
    </section>
  );
}
