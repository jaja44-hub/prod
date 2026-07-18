import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';

export default function PAYECalculation() {
  const { currentUser, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-02');

  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      try {
        // Mock data for now - will connect to backend API later
        const mockEmployees = [
          {
            id: 1,
            name: 'Abebe Kebede',
            gross_salary: 15000,
            taxable_income: 15000,
            tax_amount: 1500,
            employee_pension: 1050,
            employer_pension: 1650,
            net_salary: 12450,
            status: 'calculated'
          },
          {
            id: 2,
            name: 'Tigist Haile',
            gross_salary: 18000,
            taxable_income: 18000,
            tax_amount: 2100,
            employee_pension: 1260,
            employer_pension: 1980,
            net_salary: 14640,
            status: 'calculated'
          },
          {
            id: 3,
            name: 'Dawit Bekele',
            gross_salary: 22000,
            taxable_income: 22000,
            tax_amount: 3000,
            employee_pension: 1540,
            employer_pension: 2420,
            net_salary: 17460,
            status: 'pending'
          }
        ];
        setEmployees(mockEmployees);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadEmployees();
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'name', header: 'Employee Name' },
    { key: 'gross_salary', header: 'Gross Salary', render: (r) => formatEtb(r.gross_salary) },
    { key: 'taxable_income', header: 'Taxable Income', render: (r) => formatEtb(r.taxable_income) },
    { key: 'tax_amount', header: 'Tax Amount', render: (r) => formatEtb(r.tax_amount) },
    { key: 'employee_pension', header: 'Employee Pension (7%)', render: (r) => formatEtb(r.employee_pension) },
    { key: 'employer_pension', header: 'Employer Pension (11%)', render: (r) => formatEtb(r.employer_pension) },
    { key: 'net_salary', header: 'Net Salary', render: (r) => formatEtb(r.net_salary) },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.status} label={r.status} /> }
  ];

  const totalGrossSalary = employees.reduce((sum, e) => sum + e.gross_salary, 0);
  const totalTax = employees.reduce((sum, e) => sum + e.tax_amount, 0);
  const totalEmployeePension = employees.reduce((sum, e) => sum + e.employee_pension, 0);
  const totalEmployerPension = employees.reduce((sum, e) => sum + e.employer_pension, 0);

  return (
    <section>
      <PageHeader title="PAYE Calculation" subtitle="Employee tax and pension calculations" />
      
      <PageCard className="mb-6">
        <h3 className="text-lg font-semibold mb-4">PAYE Summary - {selectedMonth}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Total Gross Salary</div>
            <div className="text-2xl font-bold">{formatEtb(totalGrossSalary)}</div>
          </div>
          <div className="p-4 bg-red-50 rounded">
            <div className="text-sm text-gray-600">Total Tax Payable</div>
            <div className="text-2xl font-bold text-red-600">{formatEtb(totalTax)}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded">
            <div className="text-sm text-gray-600">Total Employee Pension (7%)</div>
            <div className="text-2xl font-bold text-blue-600">{formatEtb(totalEmployeePension)}</div>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <div className="text-sm text-gray-600">Total Employer Pension (11%)</div>
            <div className="text-2xl font-bold text-green-600">{formatEtb(totalEmployerPension)}</div>
          </div>
        </div>
        <button className="mt-4 px-6 py-2 bg-violet-600 text-white rounded">Generate Payment Voucher</button>
      </PageCard>

      <PageCard>
        <DataTable columns={columns} rows={employees} rowKey="id" loading={loading} />
      </PageCard>
    </section>
  );
}
