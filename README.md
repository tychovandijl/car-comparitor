# AutoVergelijker

Vergelijk tweedehands auto's van **Marktplaats** en **AutoScout24** op prijs, kilometerstand, bouwjaar en uitrusting. Elke auto krijgt een score van 0–100.

## Features

- Zoeken op merk, model of trefwoord
- Filteren op bouwjaar, prijs, kilometerstand en bron
- Score 0–100 per auto met breakdown (prijs, km, jaar, uitrusting)
- Vergelijking van 2–4 auto's side-by-side
- Directe link naar originele advertentie

## Lokale ontwikkeling

### Vereisten
- Node.js 18+
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)

### Frontend starten

```bash
npm install
npm run dev
```
Frontend draait op http://localhost:5173

### Backend (Azure Functions) starten

```bash
cd api
npm install
func start
```
API draait op http://localhost:7071

Vite stuurt `/api/*` requests automatisch door naar de Azure Function (geconfigureerd in `vite.config.js`).

### Gecombineerd via SWA CLI (optioneel)

```bash
npm install -g @azure/static-web-apps-cli
swa start http://localhost:5173 --api-location ./api
```

## Deployen naar Azure

1. Maak een **GitHub repository** aan en push de code
2. Maak een **Azure Static Web App** aan in de Azure Portal
3. Koppel aan je GitHub repository
4. De GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`) wordt automatisch aangemaakt

## Score algoritme

| Factor | Gewicht | Berekening |
|--------|---------|------------|
| Prijs | 40% | Prijs t.o.v. mediaan van vergelijkbare auto's |
| Kilometerstand | 25% | 0 km = 100 pts, 300.000 km = 0 pts |
| Bouwjaar | 20% | Huidig jaar = 100 pts, 20+ jaar oud = 0 pts |
| Uitrusting | 15% | Aantal features als % van maximum in resultatenset |

**Scoreklassen:**
- 80–100: Uitstekend (groen)
- 60–79: Goed (geel-groen)
- 40–59: Gemiddeld (geel)
- 0–39: Matig (rood)
