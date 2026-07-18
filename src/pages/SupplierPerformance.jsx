import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import { formatEtb } from '../lib/formatEtb';

export default function SupplierPerformance() {
  const { currentUser, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSuppliers() {
      setLoading(true);
      try {
        const mockData = [
          { id: 1, name: 'Ethio Construction', orders: 15, delivery: 92, quality: 88, rating: 4.2, value: 1250000 },
          { id: 2, name: 'Addis Agro', orders: 22, delivery: 85, quality: 95, rating: 4.5, value: 890000 },
          { id: 3, name: 'Tech Solutions', orders: 8, delivery: 78, quality: 92, rating: 3.8, value: 450000 }
        ];
        setSuppliers(mockData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    if (!authLoading && currentUser) loadSuppliers();
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'name', header: 'Supplier' },
    { key: 'orders', header: 'Orders' },
    { key: 'delivery', header: 'Delivery %', render: (r) => `${r.delivery}%` },
    { key: 'quality', header: 'Quality', render: (r) => `${r.quality}/100` },
    { key: 'rating', header: 'Rating', render: (r) => `${r.rating}/5` },
    { key: 'value', header: 'Total Value', render: (r) => formatEtb(r.value) }
  ];

  return (
    <section>
      <PageHeader title="Supplier Performance" subtitle="Multi-factor supplier scoring" />
      <PageCard><DataTable columns={columns} rows={suppliers} rowKey="id" loading={loading} /></PageCard>
    </section>
  );
}
