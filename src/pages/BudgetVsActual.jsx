import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import { formatEtb } from '../lib/formatEtb';

export default function BudgetVsActual() {
  const { currentUser, loading: authLoading } = useAuth();
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBudgetData() {
      setLoading(true);
      try {
        const mockData = [
          { id: 1, category_name: 'Construction', budgeted: 500000, actual: 425000, remaining: 30000, utilization: 85, status: 'on_track' },
          { id: 2, category_name: 'Office Supplies', budgeted: 75000, actual: 82000, remaining: -12000, utilization: 109, status: 'over_budget' },
          { id: 3, category_name: 'IT Equipment', budgeted: 200000, actual: 145000, remaining: 25000, utilization: 72.5, status: 'under_budget' }
        ];
        setBudgetData(mockData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    if (!authLoading && currentUser) loadBudgetData();
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'category_name', header: 'Category' },
    { key: 'budgeted', header: 'Budgeted', render: (r) => formatEtb(r.budgeted) },
    { key: 'actual', header: 'Actual', render: (r) => formatEtb(r.actual) },
    { key: 'utilization', header: 'Utilization %', render: (r) => `${r.utilization.toFixed(1)}%` },
    { key: 'status', header: 'Status', render: (r) => r.status }
  ];

  return (
    <section>
      <PageHeader title="Budget vs Actual" subtitle="Budget utilization analysis" />
      <PageCard><DataTable columns={columns} rows={budgetData} rowKey="id" loading={loading} /></PageCard>
    </section>
  );
}
