import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getOdooManufacturingOrders, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';

export default function WorkOrders() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ state: '' });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  const loadOrders = async (currentFilters) => {
    setLoading(true);
    setError('');
    try {
      const result = await getOdooManufacturingOrders(50, { state: currentFilters.state || undefined });
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load manufacturing orders.';
      if (message.toLowerCase().includes('mrp.production') || message.toLowerCase().includes('manufacturing module')) {
        setError(t('manufacturingModuleInactive'));
      } else {
        setError(message === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(filters);
  }, [filters, t]);

  const stateColumns = ['draft', 'confirmed', 'progress', 'done', 'cancel'];

  const columns = [
    { key: 'name', header: t('order'), render: (r) => r.name || '—' },
    { key: 'product_id', header: t('product'), render: (r) => r.product_id?.[1] || '—' },
    { key: 'product_qty', header: t('quantity'), className: 'erp-num', render: (r) => r.product_qty ?? '—' },
    { key: 'state', header: t('state'), render: (r) => <StateBadge state={r.state} label={r.state ? t(`state${r.state.charAt(0).toUpperCase() + r.state.slice(1)}`) || r.state : '—'} /> },
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => r.id && navigate(`/work-orders/${r.id}`)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
        {t('viewEdit') || 'Edit'}
      </button>
    )},
  ];

  return (
    <section>
      <PageHeader
        title={`${t('manufacturingOrders')} - Shop Floor`}
        subtitle={t('manufacturingOrdersDescription')}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  viewMode === 'kanban' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                Kanban
              </button>
            </div>
            <button onClick={() => navigate('/work-orders/new')} className="btn-primary">
              + {t('createWorkOrder') || 'New Work Order'}
            </button>
          </div>
        }
      />

      <PageCard>
        <ListFilterBar
          model="mrp.production"
          value={filters}
          onChange={setFilters}
          onApply={() => loadOrders(filters)}
          onClear={() => { setFilters({ state: '' }); loadOrders({ state: '' }); }}
          fields={['state']}
          loading={loading}
        />

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => loadOrders(filters)} />
          </div>
        )}

        {viewMode === 'list' ? (
          <DataTable
            columns={columns}
            rows={orders}
            rowKey="id"
            loading={loading}
            emptyTitle={t('noResults')}
            emptyIcon="⚙️"
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
            {stateColumns.map(col => {
              const colOrders = orders.filter(o => (o.state || 'draft') === col);
              return (
                <div key={col} className="w-72 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200/60 dark:border-gray-850">
                  <h3 className="font-semibold text-xs text-gray-500 dark:text-gray-400 capitalize mb-3 px-1 flex items-center justify-between">
                    <span>{col}</span>
                    <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full text-[10px]">{colOrders.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {colOrders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/work-orders/${order.id}`)}
                        className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-400 transition-colors cursor-pointer"
                      >
                        <div className="font-bold text-xs text-violet-700 dark:text-violet-400">{order.name}</div>
                        <div className="text-xs text-gray-800 dark:text-gray-200 mt-1 truncate">{order.product_id?.[1]}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">Qty: {order.product_qty}</div>
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-600 italic px-1 py-4 text-center">
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>
    </section>
  );
}
