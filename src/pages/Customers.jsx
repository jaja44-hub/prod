import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { getCustomers } from '../lib/neonSalesAPI';
import { getSuppliers } from '../lib/neonPurchaseAPI';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { buildCustomerPosture } from '../lib/crmDepth';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile } from '../components/analytics/AnalyticsCharts';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Customers() {
  const { t } = useLang();
  const { snapshot } = useAnalyticsSnapshot();
  const [activeTab, setActiveTab] = useState('customers'); // customers, vendors, delivery
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '' });
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [customerPosture, setCustomerPosture] = useState(null);

  // Mock Logistics Delivery Terms Config
  const [deliveryTerms] = useState([
    { id: 1, name: 'FOB - Free on Board', description: 'Seller pays for transportation of the goods to the port of shipment.', default: false },
    { id: 2, name: 'EXW - Ex Works', description: 'Seller makes goods available at their premises.', default: true },
    { id: 3, name: 'DDP - Delivered Duty Paid', description: 'Seller is responsible for delivering the goods to the named place in the country of the buyer.', default: false },
  ]);

  const normalizeErrorMessage = (err) => {
    const raw = err?.error || err?.message || t('error');
    return raw;
  };

  const loadData = async (currentFilters) => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'customers') {
        const res = await getCustomers({ tenant_id: 'tenant_default', search: currentFilters.search || undefined });
        setCustomers(res.data || res || []);
      } else if (activeTab === 'vendors') {
        const res = await getSuppliers({ tenant_id: 'tenant_default', search: currentFilters.search || undefined });
        setVendors(res.data || res || []);
      }
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'delivery') {
      loadData(filters);
    }
  }, [activeTab, filters]);

  const partnerColumns = [
    { key: 'name', header: t('name'), className: 'font-semibold text-gray-900 dark:text-gray-100' },
    { key: 'email', header: t('email'), className: 'text-gray-600 dark:text-gray-400' },
    { key: 'phone', header: t('phone'), className: 'text-gray-600 dark:text-gray-400' },
    { key: 'city', header: t('city'), className: 'text-gray-600 dark:text-gray-400' },
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => { setSelectedPartner(r); setCustomerPosture(buildCustomerPosture(r)); }} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
        View posture
      </button>
    ) },
  ];

  const deliveryColumns = [
    { key: 'name', header: 'Term Code', className: 'font-semibold' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.default ? 'posted' : 'neutral'} label={r.default ? 'Default' : 'Optional'} /> },
  ];

  // Prepare analytics data
  const activeCustomers = customers.filter(c => c.active).length;
  const inactiveCustomers = customers.filter(c => !c.active).length;
  const customerStatusData = [
    { name: 'Active', value: activeCustomers, color: '#10b981' },
    { name: 'Inactive', value: inactiveCustomers, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const activeVendors = vendors.filter(v => v.active).length;
  const inactiveVendors = vendors.filter(v => !v.active).length;
  const vendorStatusData = [
    { name: 'Active', value: activeVendors, color: '#8b5cf6' },
    { name: 'Inactive', value: inactiveVendors, color: '#ec4899' }
  ].filter(d => d.value > 0);

  // Customer city distribution for bar chart
  const cityDistribution = customers.reduce((acc, c) => {
    const city = c.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});
  const cityChartData = Object.entries(cityDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <section>
      <PageHeader
        title={`${t('crm')} & Logistics`}
        subtitle={t('crmDescription')}
      />

      {/* Analytics Section */}
      {activeTab !== 'delivery' && (
        <PageCard className="mb-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <MetricTile 
                label={activeTab === 'customers' ? 'Total Customers' : 'Total Vendors'} 
                value={activeTab === 'customers' ? customers.length : vendors.length} 
                detail="All records" 
                tone={activeTab === 'customers' ? 'violet' : 'emerald'} 
              />
            </div>
            <div className="lg:col-span-2 rounded-xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {activeTab === 'customers' ? 'Customer Status Distribution' : 'Vendor Status Distribution'}
              </h3>
              <div className="h-[150px]">
                {(activeTab === 'customers' ? customerStatusData : vendorStatusData).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeTab === 'customers' ? customerStatusData : vendorStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(activeTab === 'customers' ? customerStatusData : vendorStatusData).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {activeTab === 'customers' && cityChartData.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Top Cities by Customer Count</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <RechartsTooltip cursor={{fill: 'rgba(139, 92, 246, 0.05)'}} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </PageCard>
      )}

      
      <PageCard>
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => { setActiveTab('customers'); setFilters({ search: '' }); }}
            className={`py-2 px-4 font-semibold text-sm transition-colors duration-150 ${
              activeTab === 'customers'
                ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('customerTab')}
          </button>
          <button
            onClick={() => { setActiveTab('vendors'); setFilters({ search: '' }); }}
            className={`py-2 px-4 font-semibold text-sm transition-colors duration-150 ${
              activeTab === 'vendors'
                ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('vendorTab')}
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`py-2 px-4 font-semibold text-sm transition-colors duration-150 ${
              activeTab === 'delivery'
                ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Delivery Terms
          </button>
        </div>

        {activeTab !== 'delivery' && (
          <ListFilterBar
            model="res.partner"
            value={filters}
            onChange={setFilters}
            onApply={() => loadData(filters)}
            onClear={() => { setFilters({ search: '' }); loadData({ search: '' }); }}
            fields={['search']}
            loading={loading}
          />
        )}

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => loadData(filters)} />
          </div>
        )}

        {activeTab === 'delivery' ? (
          <DataTable
            columns={deliveryColumns}
            rows={deliveryTerms}
            rowKey="id"
            loading={false}
            emptyTitle={t('noResults')}
            emptyIcon="🚚"
          />
        ) : (
          <>
            <DataTable
              columns={partnerColumns}
              rows={activeTab === 'customers' ? customers : vendors}
              rowKey="id"
              loading={loading}
              emptyTitle={t('noResults')}
              emptyIcon="👥"
            />
            {selectedPartner && customerPosture && (
              <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">CRM posture</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">Follow-up needed: {customerPosture.followUpNeeded ? 'Yes' : 'No'}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">Email present: {customerPosture.hasEmail ? 'Yes' : 'No'}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">Phone present: {customerPosture.hasPhone ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </>
        )}
      </PageCard>
    </section>
  );
}
