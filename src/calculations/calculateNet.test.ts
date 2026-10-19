import { describe, expect, it } from 'vitest';
import { calculateNet, defaultInput } from './calculateNet';
import { minijobPensionMonthly } from './minijob';

describe('2026 payroll calculations', () => {
  it.each([2000, 3000, 4000, 6000])('calculates a class I wage of %i EUR per month', (amount) => {
    const result = calculateNet({ ...defaultInput(), amount });
    expect(result.main.grossAnnual).toBe(amount * 1200);
    expect(result.main.netAnnual).toBe(result.main.grossAnnual - result.main.totalDeductionsAnnual);
    expect(result.main.deductionsAnnual.wageTax).toBeGreaterThanOrEqual(0);
    if (amount === 2000) expect(result.combined).toBeNull();
  });

  it('matches a published BMF comparison vector for the 2026 PAP package', () => {
    const result = calculateNet({ ...defaultInput(), amount: 5000, additionalHealthRate: 2.5 });
    expect(result.main.deductionsMonthly.wageTax).toBe(78583);
  });

  it('calculates church tax from the PAP church tax base', () => {
    const none = calculateNet({ ...defaultInput(), amount: 6000 });
    const withChurch = calculateNet({ ...defaultInput(), amount: 6000, churchTax: true });
    const bavaria = calculateNet({ ...defaultInput(), amount: 6000, churchTax: true, state: 'Bayern' });
    expect(none.main.deductionsAnnual.churchTax).toBe(0);
    expect(withChurch.main.deductionsAnnual.churchTax).toBeGreaterThan(bavaria.main.deductionsAnnual.churchTax);
  });

  it('uses the selected insurer rate in both GKV deductions and the PAP tax calculation', () => {
    const selected = calculateNet({ ...defaultInput(), amount: 5000, healthInsurer: 'Techniker Krankenkasse (TK)', additionalHealthRate: 9 });
    const manualEquivalent = calculateNet({ ...defaultInput(), amount: 5000, healthInsurer: 'manual', additionalHealthRate: 2.69 });
    const defaultRate = calculateNet({ ...defaultInput(), amount: 5000 });
    expect(selected.main.deductionsAnnual.health).toBe(manualEquivalent.main.deductionsAnnual.health);
    expect(selected.main.deductionsAnnual.wageTax).toBe(manualEquivalent.main.deductionsAnnual.wageTax);
    expect(selected.main.deductionsAnnual.health).toBeLessThan(defaultRate.main.deductionsAnnual.health);
  });

  it('uses distinct tax classes and child care reductions', () => {
    const base = calculateNet({ ...defaultInput(), amount: 4000 });
    const classThree = calculateNet({ ...defaultInput(), amount: 4000, taxClass: 3 });
    const children = calculateNet({ ...defaultInput(), amount: 4000, children: 3, childrenUnder25: 3, childlessSurcharge: false });
    expect(classThree.main.deductionsAnnual.wageTax).toBeLessThan(base.main.deductionsAnnual.wageTax);
    expect(children.main.deductionsAnnual.care).toBeLessThan(base.main.deductionsAnnual.care);
  });

  it('keeps flat-taxed Minijob income separate from the main taxable salary', () => {
    const base = calculateNet({ ...defaultInput(), amount: 4000 });
    const exempt = calculateNet({ ...defaultInput(), amount: 4000, minijobEnabled: true, minijobGross: 603 });
    const insured = calculateNet({ ...defaultInput(), amount: 4000, minijobEnabled: true, minijobGross: 603, minijobPensionExempt: false });
    expect(exempt.main.deductionsAnnual.wageTax).toBe(base.main.deductionsAnnual.wageTax);
    expect(exempt.minijob?.netMonthly).toBe(60300);
    expect(insured.minijob?.deductionsMonthly.pension).toBe(2171);
    expect(exempt.combined?.netAnnual).toBe(base.main.netAnnual + 60300 * 12);
  });

  it('applies the Minijob minimum pension contribution below 175 EUR', () => {
    expect(minijobPensionMonthly(10000, false)).toBe(1755);
    expect(minijobPensionMonthly(10000, true)).toBe(0);
  });

  it('taxes an individually taxed Minijob using separate class VI payroll tax', () => {
    const result = calculateNet({ ...defaultInput(), minijobEnabled: true, minijobGross: 603, minijobTaxation: 'individual' });
    expect(result.minijob?.deductionsAnnual.wageTax).toBeGreaterThan(0);
    expect(result.minijob?.netAnnual).toBeLessThan(60300 * 12);
  });

  it('withholds combined net when regular Minijob earnings exceed the limit', () => {
    const result = calculateNet({ ...defaultInput(), minijobEnabled: true, minijobGross: 604 });
    expect(result.minijobValid).toBe(false);
    expect(result.combined).toBeNull();
    expect(result.warnings.join(' ')).toContain('Unvorhersehbare');
  });

  it('respects contribution ceilings, yearly bonus and cent rounding', () => {
    const a = calculateNet({ ...defaultInput(), amount: 8450 });
    const b = calculateNet({ ...defaultInput(), amount: 10000 });
    expect(b.main.deductionsAnnual.pension).toBe(a.main.deductionsAnnual.pension);
    const bonus = calculateNet({ ...defaultInput(), amount: 4000, annualBonus: 1000.01 });
    expect(bonus.main.grossAnnual).toBe(4900001);
    expect(bonus.main.netAnnual).toBe(bonus.main.grossAnnual - bonus.main.totalDeductionsAnnual);
    const annual = calculateNet({ ...defaultInput(), amount: 50000.01, period: 'year' });
    expect(annual.main.grossAnnual).toBe(5000001);
  });
});
