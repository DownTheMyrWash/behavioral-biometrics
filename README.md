# Rhythm / behavioral biometrics lab

A small, privacy-first behavioral biometrics demo for GitHub Pages. It explores typing rhythm by measuring timing patterns in the browser, building a three-round baseline, and comparing a fresh sample against it.

This project was generated mostly with GitHub Copilot for demonstration purposes.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, open **Settings > Pages**.
3. Choose **Deploy from a branch**, select the default branch and `/ (root)`.
4. Save. GitHub will publish `index.html` as the site entry point.

The site will be available at `https://YOUR-USERNAME.github.io/behavioral-biometrics/` after GitHub Pages finishes deploying.

No build command or server-side storage is required. Raw keystrokes are only held temporarily in memory while a round is active; this demo does not use `localStorage`, cookies, analytics, or network requests for results. The match result is an educational signal, not a secure identity check.
