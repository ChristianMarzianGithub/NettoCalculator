import { tax2026 } from '../config/tax2026';
import type { SalaryInput } from '../types/salary';
import { cents, rate } from './money';
import { calculateMinijobIndividualTax } from './incomeTax';

export function minijobPensionMonthly(grossCents: number, exempt: boolean): number {
  if (exempt || grossCents === 0) return 0;
  const fullContribution = rate(Math.max(grossCents, cents(tax2026.minijobPensionMinimumBase)), tax2026.minijobPensionRate);
  const employerContribution = rate(grossCents, tax2026.minijobEmployerPensionRate);
  return Math.max(0, fullContribution - employerContribution);
}

export function calculateMinijobDeductions(input: SalaryInput) {
  const grossCents = cents(input.minijobGross);
  const pension = minijobPensionMonthly(grossCents, input.minijobPensionExempt) * 12;
  const tax = input.minijobTaxation === 'individual'
    ? calculateMinijobIndividualTax(input, grossCents)
    : { wageTax: 0, solidarity: 0, churchTax: 0 };
  return { ...tax, pension };
}
