# Deploying the Wiselion website

The site is a static Vite build (no backend needed). Easiest host: **Vercel**
(free). Two ways — the dashboard (recommended, no terminal) or the CLI.

## Option A — Vercel dashboard (recommended, ~10 min)

1. **Sign up**: go to https://vercel.com → **Sign up** → "Continue with GitHub"
   (use your Wise-lion account). Authorize Vercel to see your repos.
2. **New Project**: click **Add New… → Project**.
3. **Import** the repo `wiselion-artist-engagement-app-and-website`.
4. **Set the Root Directory** — click **Edit** next to Root Directory and choose
   **`website`**. (Important: the repo has app/server/admin too; Vercel must build
   only the `website` folder.)
5. Vercel auto-detects **Vite**. Leave Build Command (`npm run build`) and Output
   Directory (`dist`) as detected. No env vars needed.
6. Click **Deploy**. ~1 minute later you get a live URL like
   `wiselion-xxxx.vercel.app`.

## Option B — Vercel CLI (terminal)
```bash
cd ~/Desktop/Code/wiselionlikeking/website
npm i -g vercel
vercel            # first run: log in, link project, set root = current dir
vercel --prod     # deploy to production
```

## Add your custom domain (after first deploy)
1. Buy a domain (Namecheap/Cloudflare/Vercel) — e.g. `wiselion.shop`.
2. In Vercel → your project → **Settings → Domains → Add** → type the domain.
3. Vercel shows DNS records (or "Set Nameservers"). Add them at your registrar.
4. Wait for it to verify (minutes to a couple hours). HTTPS is automatic.

## Auto-deploys
Once connected, **every `git push` to `main` redeploys automatically**. To update
the live site: edit, commit, push.

## Before you call it "launched"
- [ ] Replace `public/hero-lion.png` with the real lion art (or the Higgsfield video as `public/hero-lion.mp4`).
- [ ] Make the merch "COP NOW" buttons go somewhere real (Stripe payment links or Printful/Teespring product pages).
- [ ] Update tour dates / streaming links in `src/data.ts`.
- [ ] Point your social bios at the live URL.
