import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function fetchEnabledTenantModules(tenantId) {
  if (!db || !tenantId) return null;

  try {
    const tenantModulesQuery = query(
      collection(db, 'tenant_modules'),
      where('tenantId', '==', tenantId),
      where('enabled', '==', true)
    );
    const snapshot = await getDocs(tenantModulesQuery);
    const moduleIds = snapshot.docs
      .map((docSnap) => docSnap.data()?.moduleId)
      .filter((moduleId) => typeof moduleId === 'string');
    return moduleIds;
  } catch (err) {
    console.warn('[tenantSchema] fetchEnabledTenantModules failed:', err?.message || err);
    return null;
  }
}

export async function fetchPackage(packageId) {
  if (!db || !packageId) return null;

  try {
    const packageDoc = await getDoc(doc(db, 'packages', packageId));
    return packageDoc.exists() ? packageDoc.data() : null;
  } catch (err) {
    console.warn('[tenantSchema] fetchPackage failed:', err?.message || err);
    return null;
  }
}

export default {
  fetchEnabledTenantModules,
  fetchPackage,
};
