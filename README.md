# priv_conv_expt

Privacy & communication experiment (jsPsych 7 + Vite), deployed on GitHub Pages.

- **Live site:** https://selenashe.github.io/priv_conv_expt/
- **Data:** Completions can be saved to a Google Sheet via Apps Script. See [docs/DATA_BACKEND_SETUP.md](docs/DATA_BACKEND_SETUP.md).

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173. Data is saved to `results/` when using the dev server.

## Deploy to GitHub Pages

1. **Enable GitHub Pages (one-time):** In the repo **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to `main` (or run the workflow manually). The "Deploy to GitHub Pages" workflow builds and deploys the site.
3. **Optional – save data to Google Sheets:** Follow [docs/DATA_BACKEND_SETUP.md](docs/DATA_BACKEND_SETUP.md) to create an Apps Script and add the Web app URL as the repository secret `APPS_SCRIPT_WEB_APP_URL`. Then re-run the workflow or push a commit so the build includes the URL; after that, every completion will append a row to your sheet.

## Build

```bash
npm run build
```

Output is in `dist/`. For production build with data submission URL (e.g. in CI):

```bash
VITE_DATA_SUBMIT_URL='https://script.google.com/macros/s/.../exec' npm run build
```
