# Quick Fix Steps - Cache Issue on Render

## Problem
Old UI still showing after pushing updates to GitHub and deploying to Render, even after clearing browser cache.

## Root Cause
The application uses a **Service Worker** (`sw.js`) that caches files at a deeper level than browser cache. Clearing browser cache alone is not enough.

## Solution Applied

### Files Updated
1. **frontend/public/sw.js** - Updated VERSION from `yamshat-v11-fresh` to `yamshat-v12-hotfix-2025`
2. **render.yaml** - Added `npm run cache-buster` to build command and cache headers

### Steps to Deploy

#### Step 1: Push to GitHub
```bash
git add frontend/public/sw.js render.yaml
git commit -m "fix: update Service Worker cache version and Render config"
git push origin main
```

#### Step 2: Redeploy on Render
- Go to Render Dashboard
- Select `yamshat-web` service
- Click "Manual Deploy" or wait for auto-deployment
- Wait 2-3 minutes for build to complete

#### Step 3: Clear Service Worker Cache
Open browser console (F12) and run:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});
```

#### Step 4: Refresh Page
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open in Incognito/Private window

## Verification
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Confirm version shows `yamshat-v12-hotfix-2025`
4. Refresh and check for new UI

## Future Prevention
- Always run `npm run cache-buster` before building
- Keep `render.yaml` with cache headers
- Test locally first: `npm run build && npm run preview`
- Use Private/Incognito mode when testing

## Files Modified
- ✅ `frontend/public/sw.js` - Service Worker version updated
- ✅ `render.yaml` - Build command and cache headers added
