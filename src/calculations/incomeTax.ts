import { calculate } from 'lohnsteuerrechner';
import { tax2026 } from '../config/tax2026';
import { resolveAdditionalHealthRate } from '../config/healthInsurers2026';
import type { SalaryInput } from '../types/salary';
import { cents, rate } from './money';

export interface TaxAnnual { wageTax: number; solidarity: number; churchTax: number }

function churchRate(state: string): number {
  return tax2026.churchTaxReducedStates.some((item) => item === state) ? 0.08 : 0.09;
}

export function calculateMainTax(input: SalaryInput, regularMonthlyCents: number, bonusCents: number): TaxAnnual {
  const annualPeriod = input.period === 'year';
  const result = calculate(2026, {
    LZZ: annualPeriod ? 1 : 2,
    RE4: annualPeriod ? cents(input.amount) : regularMonthlyCents,
    STKL: input.taxClass,
    R: input.churchTax ? 1 : 0,
    ZKF: input.childAllowance,
    KRV: input.pensionInsurance ? 0 : 1,
    ALV: input.unemploymentInsurance ? 0 : 1,
    PKV: input.healthSystem === 'pkv' ? 1 : 0,
    KVZ: resolveAdditionalHealthRate(input.healthInsurer, input.additionalHealthRate),
    PVZ: input.childlessSurcharge && input.children === 0 && 2026 - input.birthYear >= 23 ? 1 : 0,
    PVS: input.state === 'Sachsen' ? 1 : 0,
    PVA: Math.min(4, Math.max(0, Math.min(input.childrenUnder25, input.children) - 1)),
    PKPV: input.healthSystem === 'pkv' ? cents(input.privateHealthPremium + input.privateCarePremium) : 0,
    PKPVAGZ: input.healthSystem === 'pkv' ? cents(input.employerHealthSubsidy + input.employerCareSubsidy) : 0,
    ALTER1: 2026 - input.birthYear >= 65 ? 1 : 0,
    AJAHR: input.birthYear + 65,
    SONSTB: bonusCents,
    JRE4: annualPeriod ? cents(input.amount) : regularMonthlyCents * 12,
  });
  const factor = annualPeriod ? 1 : 12;
  return {
    wageTax: result.LSTLZZ * factor + result.STS,
    solidarity: result.SOLZLZZ * factor + result.SOLZS,
    churchTax: input.churchTax ? rate(result.BK, churchRate(input.state)) * factor + rate(result.BKS, churchRate(input.state)) : 0,
  };
}

export function calculateMinijobIndividualTax(input: SalaryInput, grossMonthlyCents: number): TaxAnnual {
  const result = calculate(2026, {
    LZZ: 2,
    RE4: grossMonthlyCents,
    STKL: 6,
    R: input.churchTax ? 1 : 0,
    ZKF: 0,
    KRV: 1,
    ALV: 1,
    PKV: 1,
    PKPV: 0,
    PKPVAGZ: 0,
    ALTER1: 2026 - input.birthYear >= 65 ? 1 : 0,
    AJAHR: input.birthYear + 65,
  });
  return {
    wageTax: result.LSTLZZ * 12,
    solidarity: result.SOLZLZZ * 12,
    churchTax: input.churchTax ? rate(result.BK, churchRate(input.state)) * 12 : 0,
  };
}
