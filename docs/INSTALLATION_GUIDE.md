# Installation Guide
**Requirements:** a modern browser (Chrome/Edge recommended; Firefox/Safari expected to work). No Node, build or database needed.

```bash
git clone <your-repo-url> && cd DATA-LOCKDOWN
```
**VS Code Live Server:** install the *Live Server* extension → right-click `index.html` → *Open with Live Server*.
**Python:** `python3 -m http.server 8000` then visit http://localhost:8000
**Double-click:** opening `index.html` directly also works (no ES modules are used).

**Troubleshooting:** blank charts → check internet for the Chart.js CDN (a fallback renderer exists); to vendor Chart.js offline, download `chart.umd.min.js` into `js/vendor/` and change the `<script>` tag in `index.html`. Odd saved state → Settings → Reset, or clear site data.
