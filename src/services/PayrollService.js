/**
 * PayrollService.js — Ethiopian Payroll Engine
 * Based on Ethiopian Income Tax Proclamation No. 286/2002
 * and Ethiopian Pension Proclamation No. 714/2011
 *
 * Phase 9 Blueprint item 098.
 */

// Ethiopian Progressive Income Tax Brackets (ETB/month, 2024)
const TAX_BRACKETS = [
  { min: 0,      max: 600,      rate: 0,    deduction: 0      },
  { min: 601,    max: 1650,     rate: 0.10, deduction: 60     },
  { min: 1651,   max: 3200,     rate: 0.15, deduction: 142.5  },
  { min: 3201,   max: 5250,     rate: 0.20, deduction: 302.5  },
  { min: 5251,   max: 7800,     rate: 0.25, deduction: 565    },
  { min: 7801,   max: 10900,    rate: 0.30, deduction: 955    },
  { min: 10901,  max: Infinity, rate: 0.35, deduction: 1500   },
];

// Pension contribution rates (Proclamation 714/2011)
const PENSION = {
  employeeRate: 0.07,   // 7% from employee
  employerRate: 0.11,   // 11% from employer
};

export class PayrollService {
  /**
   * Calculate income tax for a given gross salary
   * @param {number} grossSalary - Monthly gross salary in ETB
   * @returns {number} - Tax amount in ETB
   */
  static calculateIncomeTax(grossSalary) {
    const bracket = TAX_BRACKETS.find(b => grossSalary >= b.min && grossSalary <= b.max);
    if (!bracket) return 0;
    return Math.max(0, grossSalary * bracket.rate - bracket.deduction);
  }

  /**
   * Calculate employee pension contribution
   */
  static calculateEmployeePension(grossSalary) {
    return grossSalary * PENSION.employeeRate;
  }

  /**
   * Calculate employer pension contribution
   */
  static calculateEmployerPension(grossSalary) {
    return grossSalary * PENSION.employerRate;
  }

  /**
   * Full payslip calculation for one employee
   * @param {object} employee - { name, grossSalary, allowances, deductions }
   * @param {string} complianceProfile - tenantConfig.complianceProfile
   * @returns {object} - Full payslip breakdown
   */
  static calculatePayslip(employee, complianceProfile = 'ethiopia_primary') {
    const gross = (employee.grossSalary ?? 0) + (employee.allowances ?? 0);
    const otherDeductions = employee.deductions ?? 0;
    let incomeTax = 0;
    let employeePension = 0;
    let employerPension = 0;

    if (complianceProfile === 'ethiopia_primary') {
      incomeTax = this.calculateIncomeTax(gross);
      employeePension = this.calculateEmployeePension(gross);
      employerPension = this.calculateEmployerPension(gross);
    } else {
      // global_flat fallback
      incomeTax = gross * 0.15; // flat 15%
    }

    const totalDeductions = incomeTax + employeePension + otherDeductions;
    const netSalary = gross - totalDeductions;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      period: employee.period ?? new Date().toISOString().slice(0, 7),
      grossSalary: Math.round(gross * 100) / 100,
      allowances: employee.allowances ?? 0,
      incomeTax: Math.round(incomeTax * 100) / 100,
      employeePension: Math.round(employeePension * 100) / 100,
      employerPension: Math.round(employerPension * 100) / 100,
      otherDeductions: otherDeductions,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      taxBracket: TAX_BRACKETS.find(b => gross >= b.min && gross <= b.max),
    };
  }

  /**
   * Run payroll for an array of employees
   */
  static runPayroll(employees, complianceProfile = 'ethiopia_primary') {
    return employees.map(emp => this.calculatePayslip(emp, complianceProfile));
  }

  /**
   * Format ETB currency
   */
  static formatETB(amount) {
    return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ETB';
  }

  /**
   * Get the effective tax rate for a salary
   */
  static getEffectiveTaxRate(grossSalary) {
    const tax = this.calculateIncomeTax(grossSalary);
    if (grossSalary === 0) return 0;
    return ((tax / grossSalary) * 100).toFixed(1);
  }
}

export default PayrollService;
