export const cents = (euros: number): number => Math.round(euros * 100);
export const euros = (amountCents: number): number => amountCents / 100;
export const rate = (amountCents: number, fraction: number): number => Math.round(amountCents * fraction);
export const monthly = (annualCents: number): number => Math.round(annualCents / 12);
