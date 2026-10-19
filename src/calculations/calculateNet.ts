import { tax2026 } from '../config/tax2026';
import type { CalculationResult, Deductions, JobResult, SalaryInput } from '../types/salary';
import { cents, monthly } from './money';
import { calculateMainTax } from './incomeTax';
import { calculateSocialInsurance } from './socialInsurance';
import { calculateMinijobDeductions } from './minijob';

const zeroDeductions = (): Deductions => ({ wageTax: 0, solidarity: 0, churchTax: 0, health: 0, care: 0, pension: 0, unemployment: 0 });
const deductionKeys = Object.keys(zeroDeductions()) as (keyof Deductions)[];

function job(grossAnnual: number, deductionsAnnual: Deductions): JobResult {
  const totalDeductionsAnnual = deductionKeys.reduce((sum, key) => sum + deductionsAnnual[key], 0);
  const netAnnual = grossAnnual - totalDeductionsAnnual;
  const deductionsMonthly = Object.fromEntries(deductionKeys.map((key) => [key, monthly(deductionsAnnual[key])])) as unknown as Deductions;
  return {
    grossAnnual, grossMonthly: monthly(grossAnnual), deductionsAnnual, deductionsMonthly,
    totalDeductionsAnnual, totalDeductionsMonthly: monthly(totalDeductionsAnnual),
    netAnnual, netMonthly: monthly(netAnnual),
  };
}

export function defaultInput(): SalaryInput {
  return {
    amount: 4000, period: 'month', year: 2026, taxClass: 1, state: 'Nordrhein-Westfalen',
    churchTax: false, children: 0, childrenUnder25: 0, childAllowance: 0,
    childlessSurcharge: true, birthYear: 1995, healthSystem: 'gkv', healthInsurer: 'manual',
    additionalHealthRate: tax2026.averageAdditionalHealthRate,
    privateHealthPremium: 650, privateCarePremium: 100,
    employerHealthSubsidy: 325, employerCareSubsidy: 50,
    pensionInsurance: true, unemploymentInsurance: true, annualBonus: 0,
    minijobEnabled: false, minijobGross: tax2026.minijobLimitMonthly,
    minijobPensionExempt: true, minijobTaxation: 'flat',
  };
}

export function calculateNet(input: SalaryInput): CalculationResult {
  if (input.year !== 2026) throw new Error('Nur das Steuerjahr 2026 wird unterstützt.');
  if (input.amount < 0 || input.annualBonus < 0 || input.minijobGross < 0) throw new Error('Beträge müssen mindestens null sein.');
  const regularMonthly = input.period === 'month' ? cents(input.amount) : Math.round(cents(input.amount) / 12);
  const bonus = cents(input.annualBonus);
  const tax = calculateMainTax(input, regularMonthly, bonus);
  const social = calculateSocialInsurance(input, regularMonthly, bonus);
  const main = job((input.period === 'year' ? cents(input.amount) : regularMonthly * 12) + bonus, {
    ...tax, health: social.health, care: social.care,
    pension: social.pension, unemployment: social.unemployment,
  });
  const warnings: string[] = [];
  const mainValid = regularMonthly > cents(2000);
  if (!mainValid) warnings.push('Bis 2.000 € regelmäßigem Monatslohn gelten Minijob- oder Midijob-Regeln. Dafür wird kein Netto ausgewiesen.');
  if (input.childrenUnder25 > input.children) warnings.push('Die Zahl der Kinder unter 25 kann die Gesamtzahl der Kinder nicht überschreiten.');
  if (input.healthSystem === 'pkv' && regularMonthly * 12 < cents(77400)) {
    warnings.push('Bitte prüfen, ob für die private Krankenversicherung eine Ausnahme von der Versicherungspflichtgrenze gilt.');
  }
  if (!input.minijobEnabled) return { main, mainValid, minijob: null, combined: mainValid ? main : null, warnings, minijobValid: true, employerSubsidyAnnual: social.employerSubsidy };

  const minijobValid = input.minijobGross <= tax2026.minijobLimitMonthly;
  if (!minijobValid) {
    warnings.push(`Ein regelmäßiger Verdienst über ${tax2026.minijobLimitMonthly} € monatlich ist 2026 kein Minijob. Unvorhersehbare Überschreitungen sind höchstens zweimal innerhalb eines Zeitjahres bis ${tax2026.minijobOccasionalMaximum} € möglich und erfordern eine individuelle Prüfung. Für diesen Betrag wird kein gemeinsames Netto ausgewiesen.`);
    return { main, mainValid, minijob: null, combined: null, warnings, minijobValid: false, employerSubsidyAnnual: social.employerSubsidy };
  }
  const minijobDeductions = calculateMinijobDeductions(input);
  const minijob = job(cents(input.minijobGross) * 12, { ...zeroDeductions(), ...minijobDeductions });
  const combinedAnnual = Object.fromEntries(deductionKeys.map((key) => [key, main.deductionsAnnual[key] + minijob.deductionsAnnual[key]])) as unknown as Deductions;
  const combined = job(main.grossAnnual + minijob.grossAnnual, combinedAnnual);
  return { main, mainValid, minijob, combined: mainValid ? combined : null, warnings, minijobValid, employerSubsidyAnnual: social.employerSubsidy };
}
