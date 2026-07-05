import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { listRegistryModuleIds, getModuleDef } from '../lib/moduleRegistry';
import { fetchEnabledTenantModules } from '../lib/tenantSchema';

export default function TenantSetup() {
  const { t } = useLang();
  const { userProfile, enabledModules } = useAuth();
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
        // Load main tenant doc
        const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setOrgName(data.name || '');
          setComplianceProfile(data.complianceProfile || 'ethiopia_primary');
        }

        // Load modules list
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

      // 1. Update main tenant doc
      const tenantRef = doc(db, 'tenants', tenantId);
      const tenantSnap = await getDoc(tenantRef);
      const existingData = tenantSnap.exists() ? tenantSnap.data() : {};

      await setDoc(tenantRef, {
        ...existingData,
        name: orgName.trim(),
        complianceProfile,
        updatedAt: new Date().toISOString(),
      });

      // 2. Save module entitlements
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        Loading organization settings...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">{t('tenantSetup')}</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400">Configure regional compliance profile and module access controls for your organization.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 dark:bg-gray-900 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3 dark:text-gray-200">Organization Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1 dark:text-gray-400">Organization / Tenant Name</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1 dark:text-gray-400">{t('complianceProfile')}</label>
              <select
                value={complianceProfile}
                onChange={e => setComplianceProfile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="ethiopia_primary">{t('ethiopiaPrimary')}</option>
                <option value="global_flat">{t('globalFlat')}</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-gray-800" />

        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-2 dark:text-gray-200">Available Modules</h2>
          <p className="text-xs text-slate-500 mb-4 dark:text-gray-400">Enable or disable specific modules for users within your tenant organisation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modulesList.map(modId => {
              const def = getModuleDef(modId);
              // Dashboard cannot be disabled
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
                    <h3 className="text-sm font-semibold text-slate-800 capitalize dark:text-gray-200">{modId}</h3>
                    <p className="text-xs text-slate-400 capitalize">Required Plan Tier: {def?.minPlanTier || 3}</p>
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

        <div className="pt-4 border-t border-slate-200 dark:border-gray-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saving ? t('saving') : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
