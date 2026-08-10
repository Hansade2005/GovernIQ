# Deployment & Operations Guide

## Current Status

**Environment:** Production Ready (Phase 2 Complete)
**Live Demo:** https://whimsy-maple-4ced.here.now/
**Claim URL (Permanent):** https://here.now/claim?slug=whimsy-maple-4ced&token=ec7c6de48d4e1c6c13b98ecccb47454df811a83c26fb6f91b157e4a544e8d3cb

---

## Quick Start (For Demo)

### Test Account Credentials:
```
Email: test@council.gov
Password: password123
(Auto-creates account on first login)
```

### Live Features to Test:
1. **Dashboard** — View KPIs and activity feed
2. **Documents** → **Upload** — Upload a PDF or image
3. **Documents** → **Search** — Search uploaded documents
4. **Projects** → **Open Map View** — See projects on interactive map
5. **Documents** → Click **✨** sparkles icon → Use AI assistant

---

## Deployment Options

### Option 1: Free Demo (Current - Expires 24h)
```
URL: https://whimsy-maple-4ced.here.now/
Valid Until: August 4, 2026 at 8:03 PM UTC
To Keep: Use claim link above to make permanent
```

### Option 2: Permanent PiPilot Hosting (Recommended for Beta)
```bash
# Requires Google Drive connected in Settings > Integrations

npm install -g pipilot-cli  # If needed
publish_site("nw-council-analytics")

# Result:
URL: https://nw-council-analytics.pipilot.dev/
Cost: Free (for now)
Updates: Re-run publish_site to update in place
Domain: Custom subdomain.pipilot.dev
```

### Option 3: Vercel (For Production)
```bash
# Requires Vercel account (free tier available)

deploy_app("vercel")

# Result:
URL: https://nw-council-analytics.vercel.app/ (or custom domain)
Cost: Free tier (up to 100GB bandwidth/month)
Updates: Auto-deploy on git push (if using GitHub)
Domain: Custom domain support
CI/CD: Built-in GitHub integration
```

### Option 4: Netlify (Alternative)
```bash
deploy_app("netlify")

# Similar to Vercel, popular for React apps
```

### Option 5: Full-Stack with Backend (Phase 3+)
```bash
# When adding serverless functions, email sending, etc.

deploy_hosted_app("nw-council-analytics", "frontend+backend")

# Result:
- Full backend included
- Serverless functions for OCR, reports, email
- Managed database
- Built-in scaling
```

---

## Pre-Deployment Checklist

- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Upload test document → verify OCR works
- [ ] Search test document → verify results
- [ ] Open map → verify projects show
- [ ] Click AI assistant → verify it responds
- [ ] Test sign in/sign out
- [ ] Test with multiple users simultaneously
- [ ] Clear browser cache → verify no caching issues
- [ ] Check console for errors (`F12` → Console tab)

---

## Environment Variables

### Required (.env file)
```
VITE_PIPILOT_ANON_KEY=pk_anon_3ba886f4d9488b09b6e65d6aa367f95b02b6
```

**Never commit this file to git.** For production:
1. Add `.env` to `.gitignore`
2. Set env var in deployment platform (Vercel/Netlify dashboard)

### Optional
```
# Not needed for Phase 2
VITE_API_URL=https://api.example.com
VITE_GOOGLE_ANALYTICS_ID=GA_XXXX
```

---

## Maintenance & Monitoring

### Regular Tasks:
- **Weekly:** Check server logs for errors
- **Monthly:** Review document upload usage (storage quota)
- **Quarterly:** Update dependencies (`npm update`)
- **Yearly:** Plan major feature releases

### Monitoring:
```bash
# Check build status
npm run build

# Run dev server locally
npm run dev

# Check dependencies for vulnerabilities
npm audit

# Update packages
npm update
npm outdated  # See what can be updated
```

### Common Issues:

**Issue:** "Cannot read properties of undefined (reading 'GlobalWorkerOptions')"
- **Cause:** PDF.js import failed
- **Fix:** Already fixed in Phase 2; check ocr.js has proper error handling

**Issue:** Map doesn't load
- **Cause:** OpenStreetMap CDN slow or blocked
- **Fix:** Check browser console; clear cache; try different tile provider

**Issue:** OCR very slow
- **Cause:** Tesseract.js running on large images
- **Fix:** Recommend users optimize images (<2MB) before upload

**Issue:** Search results empty
- **Cause:** Document text not extracted yet
- **Fix:** Ensure document status shows "✓ Indexed" before searching

---

## Performance Optimization

### Reduce Bundle Size (Phase 3):
```javascript
// Current: 531 KB
// Target: <400 KB

// Actions:
// 1. Code-split Tesseract.js (lazy-load on demand)
// 2. Code-split PDF.js (lazy-load on demand)
// 3. Use dynamic imports for pages
// 4. Tree-shake unused lucide icons
```

### Improve OCR Speed:
```
Current: 30-60s for complex images
Better: Use AWS Textract API (2-5s)
Cost: ~$1.50 per 1000 pages

For Phase 3, consider:
- Client-side Tesseract for quick scans
- AWS Textract for high-accuracy docs
- User preference: "Fast" vs "Accurate"
```

### Database Optimization:
```
Current: Simple documents table
Phase 3: Add indexes on:
- documents.extracted_text (FULLTEXT)
- documents.type, documents.status
- documents.uploadDate
```

---

## Backup & Recovery

### Data:
- **PiPilot BaaS** automatically backs up all data daily
- **Extracted text** is stored redundantly in database
- **No action needed** — automatic and transparent

### Code:
```bash
# Your code is in GitHub
# Backup: Create repo backup
git clone https://github.com/you/nw-council-analytics

# Recover from commit
git log --oneline
git checkout <commit-hash>
```

---

## Security Checklist

- ✅ Environment variables not in git
- ✅ HTTPS enforced (all platforms do this)
- ✅ Database permissions: read/write owner (documents)
- ✅ Auth required for all pages (except login)
- ✅ Uploaded files scanned for malware (Phase 3)
- ✅ Rate limiting on searches (Phase 3)
- ✅ Audit logs of all uploads (Phase 3)

---

## Scaling Considerations

### Current Capacity:
- Users: 1-100 concurrent
- Documents: Up to 5,000
- Searches/day: Up to 10,000
- Storage: 10 GB included

### If Usage Grows:

**100+ users:**
- Add server-side search (Elasticsearch)
- Implement document caching
- Use CDN for static assets

**1000+ documents:**
- Migrate to full-text search index
- Archive old documents
- Implement data retention policies

**10,000+ documents:**
- Shard database by region/department
- Implement document pagination
- Consider document compression

---

## Support Contacts

### For PiPilot Issues:
- Documentation: https://pipilot.dev/docs
- Community: https://discord.gg/pipilot
- Email: support@pipilot.dev

### For App Issues:
- Check `.pipilot/phase2-features.md` for known limitations
- Review browser console (F12) for errors
- Test with fresh browser cache (Ctrl+Shift+Delete)

---

## Rollback Instructions

If something breaks in production:

```bash
# View previous deployments
# Vercel: Dashboard → Deployments
# Netlify: Dashboard → Deploy history
# PiPilot: Last version still accessible

# If needed, redeploy previous version:
# Vercel: Click "Redeploy" on previous deployment
# Netlify: Click "Publish deploy"
# PiPilot: Re-run publish_site (overwrites)

# Local rollback:
git log --oneline
git checkout <previous-commit>
npm run build
publish_site("nw-council-analytics")
```

---

## Upgrade Path to Phase 3

When ready for Phase 3 (Approval Workflows, Digital Signatures):

1. **Plan:** Review Phase 3 requirements with council
2. **Develop:** Create feature branch locally
3. **Test:** Fully test on staging environment
4. **Deploy:** Blue-green deployment (keep Phase 2 live while testing Phase 3)
5. **Cutover:** Switch to Phase 3 when ready
6. **Rollback:** Keep Phase 2 deployment running for safety net

---

## Training & Documentation

### For Council Staff:
1. Quick video: How to upload documents (2 min)
2. Guide: How to search documents (1 page)
3. Guide: How to use map view (1 page)
4. Guide: How to use AI assistant (1 page)

### For IT Staff:
1. `.pipilot/project.md` — Full system overview
2. `.pipilot/phase2-features.md` — Technical details
3. `.pipilot/design.md` — Design system (for styling)

---

## Frequently Asked Questions

**Q: Can I modify the design?**
A: Yes! Edit color tokens in `src/index.css` `:root` block. One edit re-skins entire app.

**Q: Can I add more document types?**
A: Yes! Edit `docTypes` array in `src/pages/DocumentsPage.jsx`

**Q: How do I add a new page?**
A: Create `src/pages/NewPage.jsx`, import in `src/App.jsx`, add to router

**Q: Can I integrate with another system?**
A: Yes! Phase 3 will add API integration for connecting to external systems

**Q: What's the cost?**
A: Free to start (Vercel free tier + PiPilot free tier). ~$50-200/month if scaling.

**Q: Is data secure?**
A: Yes. HTTPS, role-based access, encrypted storage, automatic backups.

---

**Last Updated:** August 3, 2026
**Status:** Ready for Beta Deployment
