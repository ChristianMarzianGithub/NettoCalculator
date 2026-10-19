export type TaxClass = 1 | 2 | 3 | 4 | 5 | 6;
export type HealthSystem = 'gkv' | 'pkv';
export type MinijobTaxation = 'flat' | 'individual';

export interface SalaryInput {
  amount: number;
  period: 'month' | 'year';
  year: 2026;
  taxClass: TaxClass;
  state: string;
  churchTax: boolean;
  children: number;
  childrenUnder25: number;
  childAllowance: number;
  childlessSurcharge: boolean;
  birthYear: number;
  healthSystem: HealthSystem;
  healthInsurer: string;
  additionalHealthRate: number;
  privateHealthPremium: number;
  privateCarePremium: number;
  employerHealthSubsidy: number;
  employerCareSubsidy: number;
  pensionInsurance: boolean;
  unemploymentInsurance: boolean;
  annualBonus: number;
  minijobEnabled: boolean;
  minijobGross: number;
  minijobPensionExempt: boolean;
  minijobTaxation: MinijobTaxation;
}

export interface Deductions {
  wageTax: number;
  solidarity: number;
  churchTax: number;
  health: number;
  care: number;
  pension: number;
  unemployment: number;
}

export interface JobResult {
  grossAnnual: number;
  grossMonthly: number;
  deductionsAnnual: Deductions;
  deductionsMonthly: Deductions;
  totalDeductionsAnnual: number;
  totalDeductionsMonthly: number;
  netAnnual: number;
  netMonthly: number;
}

export interface CalculationResult {
  main: JobResult;
  mainValid: boolean;
  minijob: JobResult | null;
  combined: JobResult | null;
  warnings: string[];
  minijobValid: boolean;
  employerSubsidyAnnual: number;
}
