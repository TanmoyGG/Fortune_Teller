# Deployment Guide (Hostinger)

This project uses:
- Static frontend from `public/`
- Node.js backend (`server.js`) for dynamic Bangla name audio at `/api/name-audio`

## 1. Pre-Deployment Checklist

Before uploading, ensure:
- `npm install` works locally
- `npm start` runs locally
- `http://localhost:3000` opens the app
- Name audio endpoint works:
  - `GET /api/name-audio?name=Tanmoy`
- Static audio files exist in `public/audio/`

Optional (if messages changed):

```bash
npm run generate:audio
```

## 2. Required Files to Upload

Upload the full project except local-only folders:
- `public/`
- `scripts/` (optional on production, useful for maintenance)
- `server.js`
- `package.json`
- `package-lock.json`
- `README.md`
- `DEPLOY.md`

Do NOT upload:
- `node_modules/`
- `.venv/`
- local temp/log files

## 3. Hostinger Node App Setup

In Hostinger hPanel:
1. Create/select your subdomain (example: `fortune.yourdomain.com`).
2. Open **Node.js** app setup.
3. Set app root to your uploaded project directory.
4. Set startup file to:
   - `server.js`
5. Set Node version to a modern LTS (18+ recommended).
6. Install dependencies (via panel or SSH):

```bash
npm install --production
```

7. Start the app.

## 4. Environment Variables

No required env vars for basic run.

Optional:
- `PORT` (Hostinger usually injects this automatically)

The server already supports this pattern:
- `process.env.PORT || 3000`

## 5. Name Audio Cache Directory (Important)

Dynamic name audio is cached to:
- `public/audio/names/`

Ensure this directory is writable by the Node process.

If permissions fail, you may see 500 errors from `/api/name-audio`.

Quick fix:
- Create directory manually if missing
- Ensure write permission on `public/audio/names/`

## 6. Health Checks After Deploy

Open these URLs in browser:
1. `https://your-subdomain/` -> app loads
2. `https://your-subdomain/api/name-audio?name=Tanmoy` -> MP3 downloads/plays

In app flow test:
- Enter name
- Hear instruction with name in sequence
- Scan correct card
- Fortune text + fortune audio both work

## 7. Common Issues and Fixes

### Issue: App opens but no audio for names
- Check `/api/name-audio` URL directly
- Check server logs for `TTS exception`
- Verify `public/audio/names/` permissions

### Issue: Old JS/CSS still loading
- Browser hard refresh (`Ctrl + F5`)
- If using CDN/proxy cache, purge cache

### Issue: Name audio works locally but not on server
- Check outbound internet access from server to Google TTS endpoint
- Check SSL/HTTPS and mixed content (always use HTTPS in production)

### Issue: Startup failure
- Verify startup file is `server.js`
- Verify Node version and dependencies installed
- Check host logs for missing module errors

## 8. Safe Update Workflow

For each release:
1. Pull/upload code update
2. Run:

```bash
npm install --production
```

3. (If messages changed) run:

```bash
npm run generate:audio
```

4. Restart Node app
5. Run health checks above

## 9. Rollback Plan

Keep previous deploy zip/tag.
If release fails:
1. Restore previous version files
2. `npm install --production`
3. Restart app

This gives quick recovery without data migration complexity.
