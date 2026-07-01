# War Room Setup — turning on the marketing automation

War Room is the multi-agent AI system (`claudeclaw/warroom`) that drafts your
marketing content. The Wiselion side (bridge + admin Visibility page) is
already built. This is what's left, in order.

---

## 1. Get a Gemini API key (free tier available)

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with a Google account.
3. Click **Create API key** → choose a project (or create one) → copy the key
   (starts with `AIza...`).

## 2. Create a Telegram bot (this is how you talk to / control War Room)

1. Open Telegram, search for **@BotFather** (the official bot-creation bot).
2. Send `/newbot`.
3. Give it a name (e.g. "Wiselion War Room") and a username ending in `bot`
   (e.g. `wiselion_warroom_bot`).
4. BotFather replies with a **token** like `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`.
   Copy it.

## 3. Configure claudeclaw

```bash
cd ~/Desktop/Code/claudeclaw
cp .env.example .env   # if you haven't already
```
Open `.env` and set:
```
GOOGLE_API_KEY=AIza...your key from step 1...
TELEGRAM_BOT_TOKEN=123456789:ABC...your token from step 2...
```

## 4. Start War Room

```bash
cd ~/Desktop/Code/claudeclaw
npm install          # first time only
cd warroom
pip install -r requirements.txt   # first time only
python server.py
```
You should see it start on port 7860 with no `TELEGRAM_BOT_TOKEN is not set` error.

## 5. Connect Wiselion to it

In `wiselionlikeking/server/.env`:
```
WARROOM_URL=ws://localhost:7860
```
Restart the Wiselion server. In the admin panel → **Visibility**, the status
should flip from **OFFLINE** to **ONLINE**.

## 6. Test the loop

1. Admin → **Lotto Draws** → create a draw (or use an existing one).
2. Admin → **Visibility** → paste that draw's id → **Draft posts with @content**.
3. Real AI-drafted posts appear in the review queue (Instagram/TikTok/X/email).
4. Click **Approve & publish** on one → it's handed to @comms.

At this point drafting is real. Publishing is only as real as step 7.

---

## 7. Give agents somewhere to actually publish (the real work)

Right now "approve" hands the post text to the @comms agent, but @comms needs
**channels** connected to actually post it. Options, easiest first:

- **Email** — simplest. @comms can send via the `gmail` skill already listed
  in claudeclaw's CLAUDE.md. Point it at your list (start with just
  `wlikeking@gmail.com` sending to yourself, then a real mailing list later).
- **Your own social accounts (browser automation)** — the `agent-browser`
  skill can log in and post like a human would. Higher risk of being flagged
  by the platform; start with low-frequency, human-reviewed posts only.
- **Official APIs** (Instagram Graph API, X API, etc.) — most reliable
  long-term, but each requires its own developer app + approval process.

**Recommendation: start with email only.** Prove the draft → approve → send
loop end-to-end with zero platform risk, then add one social channel at a
time.

## 8. Run it somewhere always-on (when ready)

War Room only runs while your Mac does. For 24/7 automation, deploy
`claudeclaw/warroom` to a small always-on box (a ~$5/mo VPS, e.g. Render,
Railway, or a DigitalOcean droplet) and point `WARROOM_URL` at it instead of
`localhost`.

---

## What NOT to do yet
- Don't flip `AUTO_PROMOTE=true` in the Wiselion server until you've manually
  approved several drafts and trust the copy quality.
- Don't connect real social accounts until the email-only loop has run
  successfully at least once.
- Don't skip the human approval step in Visibility — that's the safety gate
  that keeps AI-drafted copy from going out wrong or off-brand.
