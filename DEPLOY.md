# Deployment Guide

This project now has two deployment targets:
1. Netlify (first testing phase)
2. Hostinger subdomain (production phase)

Current app behavior relevant to deployment:
- Kiosk app is served from `public/index.html`
- Mobile fortune page is `public/mobile-fortune.html`
- Kiosk audio currently uses static files from `public/audio_cartoon/`
- Name input/read is currently disabled in UI (code kept commented)

## A. Pre-Deployment Checklist (Do This First)

Before any deployment:
1. `npm install` works locally
2. `npm start` runs locally
3. `http://localhost:3000` opens kiosk page
4. `http://localhost:3000/mobile-fortune.html` opens mobile page
5. `public/audio_cartoon/` exists and contains required mp3 files

Important: `public/audio_cartoon/` is ignored by git in this repo. If you deploy directly from GitHub, these audio files will NOT be present unless you change that policy.

## B. Netlify Deployment (Testing First)

Netlify free is static-first, so use it for frontend testing now.

### Recommended method for your current setup: Manual deploy from local folder

Reason: local folder already has generated `public/audio_cartoon/` files.

Steps:
1. Ensure local `public/audio_cartoon/` is fully generated.
2. Zip the contents of `public/` (or drag the folder in Netlify manual deploy).
3. In Netlify: **Add new site** -> **Deploy manually**.
4. Upload the static `public` site files.
5. After deploy, verify:
  - `/` (kiosk page)
  - `/mobile-fortune.html` (mobile page)

If kiosk audio is missing, check whether `audio_cartoon/*.mp3` was included in uploaded files.

### Optional method: Git-based Netlify deploy

Use only if you decide to track audio in git or generate audio in CI.

Netlify settings for Git deploy:
- Build command: (leave empty)
- Publish directory: `public`

## C. Hostinger Deployment (Next Phase, Production)

Use Hostinger Node app for full project deployment (including backend endpoints).

### Files/Folders to upload

Required:
- `public/`
- `server.js`
- `package.json`
- `package-lock.json`

Optional but recommended:
- `scripts/` (for server-side audio regeneration)
- `README.md`
- `DEPLOY.md`

Do NOT upload:
- `node_modules/`
- `.venv/`
- local logs/temp files

### Hostinger hPanel Node setup

1. Create/select subdomain (example: `fortune.yourdomain.com`)
2. Open Node.js app setup
3. App root: project directory
4. Startup file: `server.js`
5. Node version: 18+
6. Install dependencies:

```bash
npm install --production
```

7. Start app

## D. Environment and Runtime Notes

- `PORT` is optional; Hostinger usually injects it.
- Server already uses `process.env.PORT || 3000`.

If `/api/name-audio` is ever used later, ensure this directory is writable:
- `public/audio/names/`

## E. Health Checks After Deploy

Netlify checks:
1. `https://<netlify-domain>/`
2. `https://<netlify-domain>/mobile-fortune.html`

Hostinger checks:
1. `https://<your-subdomain>/`
2. `https://<your-subdomain>/mobile-fortune.html`
3. (Optional) `https://<your-subdomain>/api/name-audio?name=Tanmoy`

Flow checks:
- Kiosk flow starts normally
- Wrong-card inline popup appears and auto-hides
- `Ctrl+R` shortcut works on instruction/fortune screens as restart shortcut
- Mobile page shows daily fixed fortune per browser (cookie-based)

## F. Common Issues

### Kiosk loads but no audio
- `audio_cartoon` files missing in deploy artifact
- Re-upload including `public/audio_cartoon/`

### Old JS/CSS still visible
- Hard refresh (`Ctrl+F5`)
- Purge Netlify/edge cache if needed

### Hostinger startup failure
- Check startup file (`server.js`)
- Check Node version and dependencies
- Review runtime logs

## G. Safe Release Workflow

1. Commit and push code
2. Validate local smoke test
3. Deploy to Netlify for quick static verification
4. Promote to Hostinger subdomain
5. Run health checks

## H. Rollback

Keep previous release tag/zip.
If a release fails:
1. Restore previous version
2. `npm install --production`
3. Restart app
