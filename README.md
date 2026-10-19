# NettoKlar – Brutto-Netto-Rechner 2026

Eine responsive, deutschsprachige React-Anwendung für einen regulären Hauptjob und optional **einen gewerblichen Minijob**. Alle Eingaben und Berechnungen bleiben im Browser. Es gibt keinen Server, keine Datenbank und keine Anmeldung.

## Starten

Node.js 20.19+ oder 22.12+ wird benötigt.

```bash
npm install
npm run dev
```

Der lokale Server zeigt seine Adresse im Terminal an. Tests und Produktions-Build:

`npm run dev` baut die Anwendung zuerst und startet dann einen lokalen Preview-Server. Nach Quellcodeänderungen den Server neu starten.

```bash
npm run test
npm run build
```

## Berechnung

Nur **2026** ist aktiviert. Die Lohnsteuer, der Solidaritätszuschlag und die Bemessungsgrundlage für die Kirchensteuer werden mit [`lohnsteuerrechner` 1.0.7](https://github.com/canida-software/lohnsteuer) (MIT) nach dem [BMF-Programmablaufplan 2026](https://www.bundesfinanzministerium.de/Content/DE/Downloads/Steuern/Steuerarten/Lohnsteuer/Programmablaufplan/2025-11-12-PAP-2026.html) berechnet. Die Bibliothek dokumentiert Abgleiche mit der offiziellen BMF-Schnittstelle. Die Eingaben werden in Cent übergeben. Der Kinderfreibetragszähler beeinflusst im PAP die Bemessungsgrundlagen für Solidaritätszuschlag und Kirchensteuer. Der Kirchensteuersatz ist in Bayern und Baden-Württemberg 8 %, sonst 9 %.

Kranken-, Pflege-, Renten- und Arbeitslosenversicherung verwenden die 2026er Beitragssätze und Beitragsbemessungsgrenzen aus der [Deutschen Rentenversicherung](https://www.deutsche-rentenversicherung.de/DRV/DE/Experten/Zahlen-und-Fakten/Werte-der-Rentenversicherung/werte-der-rentenversicherung) und dem [Bundesgesundheitsministerium](https://www.bundesgesundheitsministerium.de/beitraege/seite). Für GKV-Versicherte gibt es eine Auswahlliste der Krankenkassen mit den individuellen Zusatzbeitragssätzen aus der [Liste des GKV-Spitzenverbandes vom 19.10.2026](https://www.gkv-spitzenverband.de/krankenkassenliste.pdf). Der ausgewählte Satz wird sowohl für die Krankenversicherungsbeiträge als auch im BMF-PAP für die Lohnsteuer verwendet. Bei einer späteren Satzänderung oder einer nicht aufgeführten Kasse kann der Satz manuell eingegeben werden. Ohne Auswahl gelten 2,9 % als amtlicher Durchschnittswert. Kinder unter 25 reduzieren ab dem zweiten Kind den Arbeitnehmeranteil zur Pflegeversicherung um 0,25 Prozentpunkte je Kind bis zum fünften Kind. Für Sachsen gilt der erhöhte Arbeitnehmeranteil. Bei PKV werden die eingegebenen Monatsbeiträge abzüglich eingegebener Arbeitgeberzuschüsse gezeigt; die Zuschüsse sind auf die Hälfte des jeweiligen Beitrags und den gesetzlichen Höchstzuschuss begrenzt. PKV-Beiträge sind keine Lohnabzüge des Arbeitgebers, werden hier für ein vergleichbares verfügbares Einkommen aber abgezogen.

Ein jährlicher Bonus wird als sonstiger Bezug durch den PAP berechnet. Die Sozialbeiträge für den Bonus berücksichtigen den verbleibenden jährlichen Abstand zur jeweiligen Beitragsbemessungsgrenze. Die Monatsansicht zeigt den **Jahresdurchschnitt inklusive 1/12 des Bonus**. Der tatsächliche Auszahlungsmonat kann abweichen.

Beim Minijob gilt die [Verdienstgrenze von 603 € im Monat](https://www.minijob-zentrale.de/DE/meta/faq-bereich/lohn/18_mehr_als_556euro_verdienen/faq_18_mehr_als_603_euro_verdienen?nn=6928154d401de22f3aa254f0). Bei Befreiung von der Rentenversicherungspflicht gibt es keinen Arbeitnehmerbeitrag. Sonst werden 3,6 % berechnet; unter 175 € Monatslohn greift die [Mindestbeitragsbemessungsgrundlage](https://www.minijob-zentrale.de/DE/meta/faq-bereich/rentenversicherung/54_kann_ich_von_kleinem_gehalt_in_rv_einzahlen/faq_54_kann_ich_von_kleinem_gehalt_in_rv_einzahlen). Die pauschale Steuer von 2 % gilt als Arbeitgeberaufwand und mindert das Arbeitnehmernetto nicht. Bei individueller Besteuerung wird der Minijob separat mit Steuerklasse VI berechnet, wie bei einem [Nebenjob in der Regel vorgesehen](https://www.minijob-zentrale.de/SharedDocs/Downloads/DE/Online-Seminare/Skript_Online-Seminar_Steuern_im_Minijob.pdf?__blob=publicationFile). Bei regelmäßig mehr als 603 € unterdrückt die App das kombinierte Netto, da dies kein Minijob mehr ist. Unvorhersehbare, gelegentliche Überschreitungen bis 1.206 € in höchstens zwei Monaten eines Zeitjahres erfordern eine gesonderte Prüfung.

## Grenzen

- Der Rechner ist eine Information, **keine verbindliche Lohnabrechnung oder Steuerberatung**.
- Der Hauptjob wird als gewöhnliche sozialversicherungspflichtige Beschäftigung angenommen. **[Midijobs/Übergangsbereich](https://rvrecht.deutsche-rentenversicherung.de/SharedDocs/rvRecht/07_AktuelleWerte/D-G/awert_glzre_uebergangsbereich.html)**, Auszubildende, Beamte, Rentner, Mehrfachbeschäftigung und weitere Sonderfälle sind nicht berechnet. Bis 2.000 € regelmäßigem Monatslohn wird deshalb kein Netto ausgewiesen.
- Es wird genau ein zusätzlicher Minijob bei einem anderen, gewerblichen Arbeitgeber angenommen. Privathaushalts-Minijobs, mehrere gleichzeitige Minijobs und Beschäftigung beim selben Arbeitgeber sind ausgeschlossen.
- Individuelle Minijob-Steuer wird mit Steuerklasse VI berechnet. Tatsächliche ELStAM und die Einkommensteuerveranlagung können zu einem anderen Ergebnis führen.
- Für die Pflegeversicherungsabschläge muss die Zahl der berücksichtigungsfähigen Kinder unter 25 korrekt angegeben sein. Kinderfreibetragszähler und Kinderzahl sind getrennte Größen.
- PKV-Zuschüsse hängen von Versicherungsvertrag und rechtlichem Status ab. Der Rechner prüft die grundsätzliche Versicherungspflichtgrenze nicht abschließend.
- Die Berechnung setzt ein gleichbleibendes regelmäßiges Gehalt über zwölf Monate voraus. Ein- und Austritte, Fehlzeiten, Sachbezüge, Freibeträge, Faktorverfahren in Klasse IV und weitere individuelle ELStAM werden nicht erfasst.

Die Logik liegt unabhängig von React unter `src/calculations/`; Jahreswerte und Beitragssätze unter `src/config/tax2026.ts`. Vitest prüft unter anderem die veröffentlichten PAP-Vergleichswerte, Steuerklassen, Kinder, Kirchensteuer, Beitragshöchstgrenzen und Minijob-Regeln.
