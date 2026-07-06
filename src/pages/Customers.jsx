import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooCustomers, getOdooVendors, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';

export default function Customers() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('customers'); // customers, vendors, delivery
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '' });

  // Mock Logistics Delivery Terms Config
  const [deliveryTerms] = useState([
    { id: 1, name: 'FOB - Free on Board', description: 'Seller pays for transportation of the goods to the port of shipment.', default: false },
    { id: 2, name: 'EXW - Ex Works', description: 'Seller makes goods available at their premises.', default: true },
    { id: 3, name: 'DDP - Delivered Duty Paid', description: 'Seller is responsible for delivering the goods to the named place in the country of the buyer.', default: false },
  ]);

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  const loadData = async (currentFilters) => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'customers') {
        const res = await getOdooCustomers(50, { search: currentFilters.search || undefined });
        setCustomers(Array.isArray(res) ? res : []);
      } else if (activeTab === 'vendors') {
        const res = await getOdooVendors(50, { search: currentFilters.search || undefined });
        setVendors(Array.isArray(res) ? res : []);
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
  ];

  const deliveryColumns = [
    { key: 'name', header: 'Term Code', className: 'font-semibold' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.default ? 'posted' : 'neutral'} label={r.default ? 'Default' : 'Optional'} /> },
  ];

  return (
    <section>
      <PageHeader
        title={`${t('crm')} & Logistics`}
        subtitle={t('crmDescription')}
      />
      
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
          <DataTable
            columns={partnerColumns}
            rows={activeTab === 'customers' ? customers : vendors}
            rowKey="id"
            loading={loading}
            emptyTitle={t('noResults')}
            emptyIcon="👥"
          />
        )}
      </PageCard>
    </section>
  );
}
