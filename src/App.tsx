import { useMemo, useState } from 'react';
import { calculateNet, defaultInput } from './calculations/calculateNet';
import { euros } from './calculations/money';
import { states, tax2026 } from './config/tax2026';
import { healthInsurers2026, resolveAdditionalHealthRate } from './config/healthInsurers2026';
import type { Deductions, JobResult, SalaryInput, TaxClass } from './types/salary';

const money = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(euros(value));
const deductionLabels: Record<keyof Deductions, string> = {
  wageTax: 'Lohnsteuer', solidarity: 'Solidaritätszuschlag', churchTax: 'Kirchensteuer',
  health: 'Krankenversicherung', care: 'Pflegeversicherung', pension: 'Rentenversicherung',
  unemployment: 'Arbeitslosenversicherung',
};

function Info({ text }: { text: string }) {
  return <span className="info" title={text} aria-label={text} tabIndex={0}>i</span>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label} {hint && <Info text={hint} />}</span>{children}</label>;
}

function NumberInput({ value, onChange, min = 0, max, step = 1, suffix }: { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return <span className="number-wrap"><input type="number" inputMode="decimal" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Math.min(max ?? Infinity, Math.max(min, Number(event.target.value) || 0)))} />{suffix && <span className="suffix">{suffix}</span>}</span>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track" aria-hidden="true" /></label>;
}

function SummaryCard({ title, result, prominent }: { title: string; result: JobResult | null; prominent?: boolean }) {
  return <article className={`summary-card ${prominent ? 'summary-card-primary' : ''}`}>
    <div className="card-eyebrow">{title}</div>
    <div className="card-net">{result ? money(result.netMonthly) : '—'}</div>
    <div className="card-caption">Netto pro Monat</div>
    <div className="card-divider" />
    <div className="card-row"><span>Brutto</span><strong>{result ? money(result.grossMonthly) : '—'}</strong></div>
    <div className="card-row"><span>Abzüge</span><strong>{result ? money(result.totalDeductionsMonthly) : '—'}</strong></div>
  </article>;
}

function Breakdown({ title, result }: { title: string; result: JobResult | null }) {
  if (!result) return null;
  return <div className="breakdown-group"><h3>{title}</h3>{(Object.keys(deductionLabels) as (keyof Deductions)[]).map((key) =>
    <div className="breakdown-row" key={key}><span>{deductionLabels[key]}</span><strong>{money(result.deductionsMonthly[key])}</strong></div>
  )}<div className="breakdown-row total"><span>Abzüge gesamt</span><strong>{money(result.totalDeductionsMonthly)}</strong></div></div>;
}

export default function App() {
  const [input, setInput] = useState<SalaryInput>(defaultInput);
  const update = <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => setInput((old) => ({ ...old, [key]: value }));
  const result = useMemo(() => { try { return calculateNet(input); } catch { return null; } }, [input]);
  const selectedHealthRate = resolveAdditionalHealthRate(input.healthInsurer, input.additionalHealthRate);
  const effectiveRate = result?.combined && result.combined.grossAnnual > 0
    ? result.combined.totalDeductionsAnnual / result.combined.grossAnnual * 100 : 0;

  return <div className="page-shell"><header className="topbar"><div className="brand"><div className="brand-mark">N<span>€</span></div><div><strong>NettoKlar</strong><small>Dein Gehalt. Klar gerechnet.</small></div></div><span className="year-pill">Steuerjahr 2026</span></header>
    <main><div className="hero"><div><span className="eyebrow">GEHALTSRECHNER 2026</span><h1>Was bleibt wirklich übrig?</h1><p>Berechne dein Nettogehalt aus Hauptjob und zusätzlichem Minijob. Direkt im Browser, ohne Übertragung deiner Gehaltsdaten.</p></div><div className="hero-ornament" aria-hidden="true"><span>€</span></div></div>
      <div className="layout"><div className="form-column">
        <section className="panel"><div className="section-heading"><div className="section-icon">01</div><div><h2>Hauptbeschäftigung</h2><p>Angaben zu deinem regulären Gehalt</p></div></div>
          <div className="fields-grid"><Field label="Bruttogehalt" hint="Regelmäßiges steuerpflichtiges Gehalt ohne Einmalzahlung."><NumberInput value={input.amount} onChange={(v) => update('amount', v)} step={0.01} suffix="€" /></Field>
            <Field label="Zeitraum"><div className="segmented"><button className={input.period === 'month' ? 'active' : ''} onClick={() => { if (input.period === 'year') setInput({ ...input, period: 'month', amount: Math.round(input.amount / 12 * 100) / 100 }); }}>Monatlich</button><button className={input.period === 'year' ? 'active' : ''} onClick={() => { if (input.period === 'month') setInput({ ...input, period: 'year', amount: Math.round(input.amount * 12 * 100) / 100 }); }}>Jährlich</button></div></Field>
            <Field label="Steuerklasse"><select value={input.taxClass} onChange={(e) => update('taxClass', Number(e.target.value) as TaxClass)}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Steuerklasse {['I', 'II', 'III', 'IV', 'V', 'VI'][n - 1]}</option>)}</select></Field>
            <Field label="Bundesland"><select value={input.state} onChange={(e) => update('state', e.target.value)}>{states.map((state) => <option key={state}>{state}</option>)}</select></Field>
            <Field label="Geburtsjahr" hint="Ab 65 kann der Altersentlastungsbetrag gelten; der Pflegezuschlag beginnt ab 23."><input type="number" inputMode="numeric" value={input.birthYear} onChange={(event) => update('birthYear', Number(event.target.value) || 0)} /></Field>
            <Field label="Jahressonderzahlung" hint="Bonus oder andere einmalige steuerpflichtige Zahlung im Jahr 2026."><NumberInput value={input.annualBonus} onChange={(v) => update('annualBonus', v)} step={0.01} suffix="€" /></Field>
          </div><div className="toggle-stack"><Toggle label="Kirchensteuerpflichtig" checked={input.churchTax} onChange={(v) => update('churchTax', v)} /></div>
        </section>
        <section className="panel"><div className="section-heading"><div className="section-icon">02</div><div><h2>Familie & Versicherung</h2><p>Für Steuer und Sozialabgaben</p></div></div>
          <div className="fields-grid"><Field label="Kinder insgesamt" hint="Elterneigenschaft befreit lebenslang vom Kinderlosenzuschlag."><NumberInput value={input.children} onChange={(v) => update('children', Math.max(0, Math.floor(v)))} min={0} max={20} /></Field>
            <Field label="Kinder unter 25" hint="Ab dem zweiten Kind unter 25 sinkt der Arbeitnehmeranteil zur Pflegeversicherung um je 0,25 Prozentpunkte, höchstens viermal."><NumberInput value={input.childrenUnder25} onChange={(v) => update('childrenUnder25', Math.max(0, Math.floor(v)))} min={0} max={input.children} /></Field>
            <Field label="Kinderfreibetragszähler" hint="ELStAM-Zähler, häufig 0,5 pro Kind und Elternteil. Er beeinflusst Soli und Kirchensteuer, gewöhnlich nicht die Lohnsteuer."><NumberInput value={input.childAllowance} onChange={(v) => update('childAllowance', v)} step={0.5} /></Field>
            <Field label="Krankenversicherung"><select value={input.healthSystem} onChange={(e) => update('healthSystem', e.target.value as SalaryInput['healthSystem'])}><option value="gkv">Gesetzlich (GKV)</option><option value="pkv">Privat (PKV)</option></select></Field></div>
          <div className="toggle-stack"><Toggle label="Kinderlosenzuschlag zur Pflegeversicherung" checked={input.childlessSurcharge} onChange={(v) => update('childlessSurcharge', v)} /><Toggle label="Rentenversicherungspflichtig" checked={input.pensionInsurance} onChange={(v) => update('pensionInsurance', v)} /><Toggle label="Arbeitslosenversicherungspflichtig" checked={input.unemploymentInsurance} onChange={(v) => update('unemploymentInsurance', v)} /></div>
          {input.healthSystem === 'gkv' ? <><div className="fields-grid after-toggle"><Field label="Gesetzliche Krankenkasse" hint="Die Auswahl übernimmt den veröffentlichten Zusatzbeitragssatz dieser Krankenkasse."><select value={input.healthInsurer} onChange={(event) => { const insurer = event.target.value; setInput((old) => ({ ...old, healthInsurer: insurer, additionalHealthRate: insurer === 'manual' ? resolveAdditionalHealthRate(old.healthInsurer, old.additionalHealthRate) : old.additionalHealthRate })); }}><option value="manual">Andere / Satz selbst eingeben</option>{healthInsurers2026.map(([name, rate]) => <option key={name} value={name}>{name} ({rate.toLocaleString('de-DE', { minimumFractionDigits: 2 })} %)</option>)}</select></Field><Field label="Zusatzbeitrag der Krankenkasse" hint="Zum allgemeinen GKV-Satz von 14,6 % kommt dieser kassenindividuelle Satz hinzu. Arbeitnehmer und Arbeitgeber tragen jeweils die Hälfte."><NumberInput value={selectedHealthRate} onChange={(value) => setInput((old) => ({ ...old, healthInsurer: 'manual', additionalHealthRate: value }))} step={0.01} max={10} suffix="%" /></Field></div><p className="form-note">Beitragssatz: {(14.6 + selectedHealthRate).toLocaleString('de-DE', { minimumFractionDigits: 2 })} % gesamt, davon {((14.6 + selectedHealthRate) / 2).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} % Arbeitnehmeranteil. Kassensätze: Stand 19.10.2026. Änderungen kannst du im Prozentfeld eingeben. <a href="https://www.gkv-spitzenverband.de/service/krankenkassenliste/krankenkassen.jsp" target="_blank" rel="noreferrer">Aktuelle Liste ↗</a></p></>
            : <div className="fields-grid after-toggle"><Field label="PKV-Beitrag monatlich"><NumberInput value={input.privateHealthPremium} onChange={(v) => update('privateHealthPremium', v)} step={0.01} suffix="€" /></Field><Field label="Private Pflegeversicherung monatlich"><NumberInput value={input.privateCarePremium} onChange={(v) => update('privateCarePremium', v)} step={0.01} suffix="€" /></Field><Field label="Arbeitgeberzuschuss zur PKV" hint="Monatlicher Zuschuss. Der Rechner begrenzt ihn auf die Hälfte des Beitrags und den gesetzlichen Höchstbetrag."><NumberInput value={input.employerHealthSubsidy} onChange={(v) => update('employerHealthSubsidy', v)} step={0.01} suffix="€" /></Field><Field label="Arbeitgeberzuschuss zur Pflege"><NumberInput value={input.employerCareSubsidy} onChange={(v) => update('employerCareSubsidy', v)} step={0.01} suffix="€" /></Field></div>}
        </section>
        <section className="panel"><div className="section-heading"><div className="section-icon">03</div><div><h2>Zusätzlicher Minijob</h2><p>Ein gewerblicher Minijob neben dem Hauptjob</p></div><input className="section-check" aria-label="Minijob aktivieren" type="checkbox" checked={input.minijobEnabled} onChange={(e) => update('minijobEnabled', e.target.checked)} /></div>
          {input.minijobEnabled && <><div className="fields-grid"><Field label="Minijob-Brutto pro Monat"><NumberInput value={input.minijobGross} onChange={(v) => update('minijobGross', v)} step={0.01} suffix="€" /></Field><Field label="Besteuerung" hint="Beim zusätzlichen Job ist bei individueller Besteuerung in der Regel Steuerklasse VI anzuwenden."><select value={input.minijobTaxation} onChange={(e) => update('minijobTaxation', e.target.value as SalaryInput['minijobTaxation'])}><option value="flat">2 % Pauschsteuer (Arbeitgeber)</option><option value="individual">Individuell (Steuerklasse VI)</option></select></Field></div><div className="toggle-stack"><Toggle label="Von der Rentenversicherungspflicht befreit" checked={input.minijobPensionExempt} onChange={(v) => update('minijobPensionExempt', v)} /></div><p className="form-note">Regelmäßige Verdienstgrenze 2026: {tax2026.minijobLimitMonthly} € pro Monat. Die 2 % Pauschsteuer wird als Arbeitgeberaufwand behandelt.</p></>}
        </section><button className="reset" onClick={() => setInput(defaultInput())}>↺ &nbsp; Auf Standardwerte zurücksetzen</button>
      </div><aside className="results-column"><section className="results-panel"><div className="results-head"><span className="eyebrow">DEIN ERGEBNIS</span><span className="live-dot">Live berechnet</span></div>
          {result?.combined ? <><div className="main-number">{money(result.combined.netMonthly)}</div><div className="main-number-caption">gemeinsames Netto pro Monat</div><div className="annual-line"><span>Netto pro Jahr</span><strong>{money(result.combined.netAnnual)}</strong></div><div className="rate-line"><span>Effektive Abzüge</span><strong>{effectiveRate.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %</strong></div></> : <div className="no-result">Gemeinsames Netto für diese Eingaben nicht berechenbar.</div>}
        </section>{result?.warnings.map((warning) => <div className="warning" role="alert" key={warning}><span>!</span><p>{warning}</p></div>)}
        {result?.combined && <><div className="summary-grid"><SummaryCard title="Hauptbeschäftigung" result={result.main} /><SummaryCard title="Minijob" result={result.minijob} /><SummaryCard title="Zusammen" result={result.combined} prominent /></div><section className="panel breakdown-panel"><h2>Wohin geht dein Geld?</h2><p className="breakdown-subtitle">Monatlicher Durchschnitt einschließlich anteiligem Bonus</p><Breakdown title="Hauptbeschäftigung" result={result.main} /><Breakdown title="Minijob" result={result.minijob} />{input.healthSystem === 'pkv' && <p className="form-note">Im PKV-Abzug ist der Arbeitgeberzuschuss von {money(Math.round(result.employerSubsidyAnnual / 12))} pro Monat bereits berücksichtigt.</p>}</section></>}
      </aside></div><footer>Dieser Rechner dient zur Orientierung und ersetzt keine verbindliche Lohnabrechnung oder Steuerberatung. Sonderfälle und abweichende ELStAM können das Ergebnis verändern. <a href="https://www.bundesfinanzministerium.de/Content/DE/Downloads/Steuern/Steuerarten/Lohnsteuer/Programmablaufplan/2025-11-12-PAP-2026.html" target="_blank" rel="noreferrer">BMF-Programmablaufplan 2026 ↗</a></footer>
    </main></div>;
}
