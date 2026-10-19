export const tax2026 = {
  year: 2026,
  minijobLimitMonthly: 603,
  minijobOccasionalMaximum: 1206,
  minijobPensionMinimumBase: 175,
  minijobPensionRate: 0.186,
  minijobEmployerPensionRate: 0.15,
  minijobEmployeePensionRate: 0.036,
  healthCeilingMonthly: 5812.5,
  pensionCeilingMonthly: 8450,
  healthRate: 0.146,
  averageAdditionalHealthRate: 2.9,
  pensionRate: 0.186,
  unemploymentRate: 0.026,
  careRate: 0.036,
  careChildlessSurcharge: 0.006,
  careChildDiscount: 0.0025,
  churchTaxReducedStates: ['Baden-Württemberg', 'Bayern'],
} as const;

export const states = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt',
  'Schleswig-Holstein', 'Thüringen',
] as const;
