import { tax2026 } from '../config/tax2026';
import { resolveAdditionalHealthRate } from '../config/healthInsurers2026';
import type { SalaryInput } from '../types/salary';
import { cents, rate } from './money';

export interface SocialInsuranceAnnual {
  health: number;
  care: number;
  pension: number;
  unemployment: number;
  employerSubsidy: number;
}

export function calculateSocialInsurance(input: SalaryInput, regularMonthlyCents: number, bonusCents: number): SocialInsuranceAnnual {
  const healthCeiling = cents(tax2026.healthCeilingMonthly);
  const pensionCeiling = cents(tax2026.pensionCeilingMonthly);
  const annualPeriod = input.period === 'year';
  const annualRegular = annualPeriod ? cents(input.amount) : regularMonthlyCents * 12;
  const regularHealthBase = Math.min(annualPeriod ? annualRegular : regularMonthlyCents, healthCeiling * (annualPeriod ? 12 : 1));
  const regularPensionBase = Math.min(annualPeriod ? annualRegular : regularMonthlyCents, pensionCeiling * (annualPeriod ? 12 : 1));
  const bonusHealthBase = Math.min(bonusCents, Math.max(0, healthCeiling * 12 - annualRegular));
  const bonusPensionBase = Math.min(bonusCents, Math.max(0, pensionCeiling * 12 - annualRegular));
  const yearly = (base: number, bonusBase: number, fraction: number) => rate(base, fraction) * (annualPeriod ? 1 : 12) + rate(bonusBase, fraction);

  const pension = input.pensionInsurance ? yearly(regularPensionBase, bonusPensionBase, tax2026.pensionRate / 2) : 0;
  const unemployment = input.unemploymentInsurance ? yearly(regularPensionBase, bonusPensionBase, tax2026.unemploymentRate / 2) : 0;

  if (input.healthSystem === 'pkv') {
    const healthPremium = cents(input.privateHealthPremium) * 12;
    const carePremium = cents(input.privateCarePremium) * 12;
    const healthSubsidy = Math.min(cents(input.employerHealthSubsidy) * 12, Math.round(healthPremium / 2), yearly(regularHealthBase, bonusHealthBase, (tax2026.healthRate + tax2026.averageAdditionalHealthRate / 100) / 2));
    const careSubsidy = Math.min(cents(input.employerCareSubsidy) * 12, Math.round(carePremium / 2), yearly(regularHealthBase, bonusHealthBase, input.state === 'Sachsen' ? 0.013 : 0.018));
    return { health: healthPremium - healthSubsidy, care: carePremium - careSubsidy, pension, unemployment, employerSubsidy: healthSubsidy + careSubsidy };
  }

  const health = yearly(regularHealthBase, bonusHealthBase, (tax2026.healthRate + resolveAdditionalHealthRate(input.healthInsurer, input.additionalHealthRate) / 100) / 2);
  const childDiscounts = Math.min(4, Math.max(0, Math.min(input.childrenUnder25, input.children) - 1));
  const careEmployeeRate = (input.state === 'Sachsen' ? 0.023 : 0.018)
    + (input.childlessSurcharge && input.children === 0 && 2026 - input.birthYear >= 23 ? tax2026.careChildlessSurcharge : 0)
    - childDiscounts * tax2026.careChildDiscount;
  const care = yearly(regularHealthBase, bonusHealthBase, careEmployeeRate);
  return { health, care, pension, unemployment, employerSubsidy: 0 };
}
