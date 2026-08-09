# Claude Code Prompts — Klar App Improvements

Run these prompts in order. Each one is self-contained.

---

## PROMPT 0 — CRITICAL: Rotate leaked secrets

```
URGENT SECURITY: The file .env.local has been committed with real API keys (Supabase service role key, Apify token, OpenAI key, Google OAuth secret, Anthropic key, Vercel OIDC token). These are all compromised.

1. Add .env.local to .gitignore if it's not already there
2. Create a .env.example file with all the same variable names but placeholder values like "your_xxx_here"
3. I need to rotate ALL these keys in their respective dashboards — list every key that needs rotating and where to do it (Supabase dashboard, Google Cloud Console, Apify console, OpenAI dashboard, Anthropic console)
4. If there's any git history with these keys, note that in a comment at the top of .env.example

Do NOT change any actual key values, just set up the gitignore and example file.
```

---

## PROMPT 1 — Migrate from Apify to Instagram Graph API (Meta Official)

```
Migrate the entire Instagram data layer from Apify scraping to the official Instagram Graph API (Meta Business SDK). This is a major refactor. Read the Next.js 16 docs in node_modules/next/dist/docs/ before writing any code.

### Current state:
- lib/scraper.ts uses Apify actors to scrape profiles and reels
- lib/sync.ts calls scrapeOwnReels() to sync user's reels
- app/api/apify/connect/route.ts connects accounts via username + optional session cookie
- app/api/apify/sync/route.ts triggers sync
- app/api/apify/refresh-profile/route.ts refreshes profile data
- app/api/competitors/sync/route.ts scrapes competitor reels via Apify
- app/api/cron/sync-all/route.ts runs daily sync for all accounts
- app/connect/page.tsx has the connection UI (currently username-only, no OAuth)
- .env.local already has META_APP_ID and META_APP_SECRET placeholders

### What to build:

**1. Meta OAuth flow:**
- Create app/api/auth/instagram/route.ts — redirects to Meta's OAuth dialog requesting these permissions: instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement, business_management
- Create app/api/auth/instagram/callback/route.ts — exchanges code for a short-lived token, then exchanges for a long-lived token (60 days), saves to ig_accounts table
- The user flow: after Google login → "Connect Instagram" button → Meta OAuth → callback saves token → redirect to /marca?onboarding=1

**2. Replace lib/scraper.ts with lib/instagram.ts:**
- Create lib/instagram.ts with these functions:
  - getInstagramProfile(accessToken: string): fetches user profile (id, username, name, profile_picture_url, followers_count, media_count) via GET /me?fields=id,username,name,profile_picture_url,followers_count,media_count
  - getInstagramMedia(accessToken: string, limit?: number): fetches user's media via GET /me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit={limit}. Filter for REELS and VIDEO types only.
  - getMediaInsights(accessToken: string, mediaId: string): fetches insights for a single reel via GET /{mediaId}/insights?metric=plays,reach,saved,shares,total_interactions,likes,comments. Note: the insights API uses different metric names than basic fields — plays (not views), saved (not saves).
  - getCompetitorProfile(accessToken: string, competitorUsername: string): uses Instagram Business Discovery API: GET /me?fields=business_discovery.fields(id,username,name,profile_picture_url,followers_count,media_count,media.limit(20){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count})&ig_user_id={igUserId}. This requires the user's account to be a Business or Creator account.
  - refreshLongLivedToken(token: string): GET /access_token?grant_type=ig_refresh_token&access_token={token} — call this before expiration
- All functions should use the Graph API v21.0 base URL: https://graph.instagram.com/v21.0
- Add proper error handling with specific error types for expired tokens, rate limits, and permission errors

**3. Update lib/sync.ts:**
- Replace scrapeOwnReels() call with getInstagramMedia() + getMediaInsights() for each reel
- The Graph API gives us saves, shares, reach, and plays (views) — data Apify couldn't get. Map: plays → views, saved → saves, shares → shares, reach → reach
- Keep the multiplier calculation logic as-is
- Add token refresh check: if token expires within 7 days, auto-refresh it

**4. Update API routes:**
- Rename app/api/apify/ folder to app/api/instagram/
- app/api/instagram/connect/route.ts — now just checks if account exists (GET) or initiates OAuth (POST redirect)
- app/api/instagram/sync/route.ts — calls updated syncAccountReels()
- app/api/instagram/refresh-profile/route.ts — uses getInstagramProfile()
- app/api/competitors/sync/route.ts — uses getCompetitorProfile() via Business Discovery API instead of Apify scraping

**5. Update app/connect/page.tsx:**
- Remove the username input and session cookie fields entirely
- After Google login, show a "Connect Instagram" button that redirects to the Meta OAuth URL
- Add a note: "Requires an Instagram Business or Creator account"
- Update the badges to say "Official Meta API", "Secure OAuth", "Full analytics access"
- Keep the same visual style

**6. Update app/api/cron/sync-all/route.ts:**
- Remove the Apify quota check logic
- Add token expiration check: skip accounts with expired tokens, log warning
- Add rate limit awareness: the Graph API allows 200 calls/user/hour — add delays between accounts if needed

**7. Update ig_accounts table schema (generate SQL migration):**
- Remove columns: apify_session_cookie, data_source
- Add columns: ig_access_token (text), ig_token_expires_at (timestamptz), ig_user_id_numeric (bigint), ig_account_type (text, 'BUSINESS' or 'CREATOR')
- Rename access_token to legacy_access_token (or remove if not used elsewhere)

**8. Environment variables:**
- Use META_APP_ID and META_APP_SECRET from .env.local
- Add INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback (and production URL)
- Remove APIFY_API_TOKEN dependency

**9. Keep Apify for competitors ONLY as fallback:**
- If Business Discovery API fails for a competitor (they might not be a business account), fall back to Apify scraping
- Add a flag in the competitor sync response indicating data source: 'graph_api' | 'scraper'

**10. Update all imports:**
- Find and replace all imports from '@/lib/scraper' to '@/lib/instagram'
- Update any references to 'apify' in route paths, component props, or fetch URLs

Do NOT delete lib/scraper.ts yet — rename it to lib/scraper-legacy.ts for the competitor fallback.
```

---

## PROMPT 2 — Error handling system

```
Create a consistent error handling system for all API routes.

1. Create lib/apiResponse.ts with:
   - successJson(data, status = 200) — returns NextResponse with { ok: true, data }
   - errorJson(message, status = 400) — returns NextResponse with { ok: false, error: message }
   - withAuth(handler) — wrapper that extracts accountId from cookies, returns 401 if missing, passes accountId to handler
   - withErrorHandler(handler) — wrapper that catches errors, logs them, returns errorJson with appropriate status codes

2. Apply withAuth and withErrorHandler to ALL routes in app/api/. Every route currently does its own cookie check — centralize it.

3. For AI routes (app/api/ai/*), add a 30-second timeout using AbortSignal.timeout(30000) on Anthropic API calls. On timeout, return a friendly message: "AI analysis timed out, please try again."

4. Add input validation to every POST route — check that required fields exist and have valid types before processing. Use early returns, not try/catch for validation.
```

---

## PROMPT 3 — Loading states and skeleton screens

```
Add skeleton loading states throughout the dashboard. Currently pages render with no visual feedback during server component data fetching.

1. Create components/ui/Skeleton.tsx — a reusable skeleton component with these variants:
   - SkeletonCard: rounded rectangle with pulse animation
   - SkeletonText: multiple lines of varying width
   - SkeletonChart: chart-shaped placeholder
   - SkeletonGrid: grid of skeleton cards
   Use CSS variables --surface-2 and --surface-3 for the animation. No external libraries.

2. Add loading.tsx files to each dashboard route:
   - app/(dashboard)/dashboard/loading.tsx — 4 KPI skeleton cards + 2 chart skeletons
   - app/(dashboard)/reels/loading.tsx — skeleton grid of reel cards (3 columns)
   - app/(dashboard)/espia/loading.tsx — skeleton competitor cards
   - app/(dashboard)/crear/loading.tsx — skeleton tabs with content
   - app/(dashboard)/ventas/loading.tsx — 3 stat cards + skeleton table
   - app/(dashboard)/rayos-x/loading.tsx — skeleton patterns + predictor
   - app/(dashboard)/calendario/loading.tsx — skeleton calendar grid
   - app/(dashboard)/marca/loading.tsx — skeleton form

3. Add client-side loading states to all buttons that trigger async operations (SyncButton, AddCompetitorForm, AddSaleForm, etc.) — show a spinner SVG inside the button and disable it during loading.

4. Add the skeleton CSS to globals.css using @keyframes pulse with the existing theme variables.
```

---

## PROMPT 4 — Reusable Button component + micro-interactions

```
Improve UI interactions throughout the dashboard.

1. Create components/ui/Button.tsx — a reusable button component with:
   - Variants: primary (--accent bg), secondary (--surface-2 bg), ghost (transparent), danger
   - Sizes: sm, md, lg
   - Props: loading (shows spinner + disables), icon (optional left icon), fullWidth
   - Spinner: inline SVG circle animation, not an emoji
   - Hover: subtle scale(1.01) + box-shadow transition
   - Active: scale(0.98)

2. Replace ALL button implementations across the app with this component. Search for className="btn" and raw <button> elements.

3. Add page transition animation to .dashboard-content in globals.css:
   - On mount: opacity 0→1, translateY(6px→0), duration 200ms ease-out
   - Use @keyframes pageEnter

4. Improve the sidebar active state in globals.css:
   - Active NavLink: 3px left border with --accent, background --accent-light, font-weight 700
   - Smooth transition: 150ms ease

5. Improve KPI cards on the dashboard:
   - On hover: subtle glow (box-shadow with --accent at 0.06 opacity), scale(1.005)
   - Transition: 200ms ease

6. Replace emoji-based empty states (📥, 🕵️, etc.) with simple, minimal SVG illustrations. Each should be ~40x40px, single color using --text-faint. Create: empty-inbox, spy/search, chart-empty, calendar-empty, money-empty.
```

---

## PROMPT 5 — Onboarding flow for new users

```
Create an onboarding checklist for new users who just connected their Instagram.

1. Create a Supabase migration file supabase-onboarding-migration.sql:
   - Table: user_onboarding (account_id text references ig_accounts(id), completed_steps jsonb default '{}', dismissed boolean default false, created_at timestamptz default now())
   - RLS: users can only read/update their own row

2. Create components/Onboarding.tsx — a floating checklist card:
   - Position: fixed bottom-right, 20px margin, z-index 50
   - Collapsible with a toggle button showing progress (e.g. "2/5 done")
   - Steps with checkmarks:
     a. "Sync your reels" → triggers sync if not done, or shows green check
     b. "Set up your brand DNA" → link to /marca
     c. "Add a competitor" → link to /espia
     d. "Explore your analytics" → link to /rayos-x
     e. "Predict your next viral reel" → link to /rayos-x (scroll to predictor)
   - Each step auto-detects completion by checking: reels count > 0, brand_dna exists, competitors count > 0
   - Dismiss button that sets dismissed=true
   - Card style: --surface background, --accent border-top, --shadow-lg, max-width 320px
   - Animate in from bottom with a slide-up

3. Add Onboarding to the dashboard layout (app/(dashboard)/layout.tsx). Only render if dismissed=false and completed steps < 5.

4. When all 5 steps complete, show a celebration message with confetti-like accent dots, then auto-dismiss after 3 seconds.
```

---

## PROMPT 6 — In-app notification system

```
Build an in-app notification system.

1. Create Supabase migration supabase-notifications-migration.sql:
   - Table: notifications (id uuid default gen_random_uuid(), account_id text, type text check in ('viral_reel', 'drop_alert', 'streak_broken', 'milestone', 'sync_complete', 'token_expiring'), title text, body text, metadata jsonb, read boolean default false, created_at timestamptz default now())
   - Index on (account_id, read, created_at DESC)
   - RLS: users can only see their own notifications

2. Create lib/notifications.ts with:
   - createNotification(accountId, type, title, body, metadata?)
   - Auto-notification triggers (call these from sync and other flows):
     - After sync: if any reel has multiplier > 2.0 → "viral_reel" notification
     - After sync: if the last reel has views < 50% of average → "drop_alert"
     - Milestone: first time total views passes 1K, 10K, 50K, 100K
     - streak_broken: if no reels published in 3+ days (check in cron)
     - token_expiring: if Instagram token expires within 7 days (check in cron)

3. Create components/NotificationBell.tsx:
   - Bell icon in the dashboard topbar (next to ThemeToggle)
   - Red dot badge with unread count
   - On click: dropdown showing last 15 notifications
   - Each notification: icon by type, title, body preview, relative time, read/unread styling
   - "Mark all as read" button at top
   - Click on notification marks it as read
   - Dropdown style: --surface bg, --shadow-lg, --border, max-height 400px with scroll

4. Create app/api/notifications/route.ts:
   - GET: fetch notifications for current account (limit 20, ordered by created_at DESC)
   - PATCH: mark notification(s) as read
   
5. Add NotificationBell to the topbar in app/(dashboard)/layout.tsx, between the sync label and ThemeToggle.

6. Call the notification triggers at the end of syncAccountReels() in lib/sync.ts.
```

---

## PROMPT 7 — Performance optimization

```
Optimize performance across the app. Read the Next.js 16 docs at node_modules/next/dist/docs/ before making changes.

1. Image optimization:
   - Add Instagram CDN domains to next.config.ts images configuration: cdninstagram.com, scontent.cdninstagram.com, scontent-*.cdninstagram.com, instagram.f*.fna.fbcdn.net
   - Replace all <img> tags loading Instagram thumbnails with next/image <Image> components
   - Set appropriate width/height and use loading="lazy" for below-fold images
   - In ReelsGrid.tsx and CompetitorCard.tsx, use Image with fill + sizes prop for responsive thumbnails

2. Data caching:
   - In app/(dashboard)/layout.tsx, the 3 Supabase queries run on every page navigation within the dashboard. Wrap them with Next.js caching (check the docs for the correct API in Next.js 16 — it may be unstable_cache or a different approach). Revalidate on sync.
   - Add revalidatePath('/dashboard') call at the end of the sync API route so cached data refreshes after sync.

3. Query optimization:
   - In app/(dashboard)/dashboard/page.tsx, 6 parallel queries is a lot. The reels query and sales query can stay separate, but combine the account + brandDna queries into one. Also, the previous-period reels query should only select views,comments,shares,saves (not all fields).

4. Component optimization:
   - In ReelsGrid.tsx: if there are >50 reels, implement pagination (show 24 per page with "Load more" button) instead of rendering all at once
   - In DashboardCharts.tsx: lazy-load recharts with dynamic(() => import('recharts'), { ssr: false }) since it's a heavy client-side library

5. Add generateMetadata to all dashboard pages for better SEO (title: "Reels — Klar", "Analytics — Klar", etc.)

6. Bundle size: Check if both @anthropic-ai/sdk and openai are needed at runtime. If openai is only used for Whisper transcription in one route, consider using the REST API directly with fetch instead of the full SDK to reduce bundle size.
```

---

## PROMPT 8 — Mobile responsiveness improvements

```
Improve mobile responsiveness. The app has a MobileNav component but there are likely layout issues.

1. Audit ALL pages for mobile breakpoints. In globals.css, ensure these breakpoints work:
   - < 640px: single column, full-width cards, no sidebar
   - 640-1024px: 2-column grid where applicable
   - > 1024px: full layout with sidebar

2. Specific fixes needed:
   - Dashboard KPI cards: stack vertically on mobile (grid-template-columns: 1fr 1fr on small screens, 1fr on very small)
   - ReelsGrid: 1 column on mobile, 2 on tablet, 3 on desktop
   - The topbar (.dash-topbar): hide KPI values on mobile, show only username and bell/theme toggle
   - Charts (DashboardCharts, ReelsChart): set min-height and make responsive with aspect-ratio
   - Feature cards in crear/page.tsx: full width on mobile
   - The Espía competitor cards: full width on mobile
   - Ventas stats grid: stack on mobile

3. Touch improvements:
   - Increase tap targets to minimum 44x44px on all interactive elements
   - Add touch-action: manipulation to prevent double-tap zoom on buttons
   - Sidebar nav items need larger padding on mobile

4. Fix any horizontal overflow issues — add overflow-x: hidden on the main content area and test each page.
```

---

## PROMPT 9 — Dashboard charts upgrade

```
Upgrade the dashboard charts using recharts (already installed).

1. In DashboardCharts.tsx, improve the existing charts:
   - Add a tooltip that shows exact values on hover (formatted with the existing formatNumber util)
   - Use the CSS variables for colors: --accent for primary line, --success for positive areas, --text-muted for axis labels
   - Add smooth animation on mount (animationDuration={800})
   - Make charts responsive with ResponsiveContainer from recharts

2. Add a new chart to the dashboard: "Best posting times" heatmap
   - 7 rows (days of week) x 24 columns (hours)
   - Color intensity based on average multiplier for reels posted at that day/hour
   - Data comes from the reels already fetched in dashboard/page.tsx
   - Use a simple div-based grid with background-color opacity (no need for a recharts heatmap)

3. In ReelsChart.tsx (used on the reels page), add:
   - A toggle between "Views" and "Engagement Rate" views
   - Clickable bars/points that link to the individual reel detail page

4. Style all chart containers consistently: --surface background, --border border, --radius-lg border-radius, padding 20px. Add a header with title and optional subtitle.
```

---

## PROMPT 10 — Content Pipeline upgrade

```
The pipeline page (/pipeline) needs to be a proper Kanban board for content creation.

1. In components/contenido/ContentPipeline.tsx, rebuild it as a drag-and-drop Kanban:
   - Columns: "Ideas" → "Writing" → "Recording" → "Editing" → "Ready" → "Published"
   - Each card shows: title/hook, format tag (talking_head/voiceover/text), target date, virality score if predicted
   - Drag between columns to update status (use native HTML5 drag and drop, no external libraries)
   - On drop: call API to update the content item's status

2. Create app/api/content/reorder/route.ts — updates the position and column of a content item

3. Add quick-add: a floating "+" button in each column header that opens an inline form with just a title field. Press Enter to create.

4. Connect to the existing content table in Supabase. If the schema doesn't have a "status" or "column" field, generate a migration to add: status text default 'idea', position integer default 0.

5. Add filters at the top: by format, by date range, search by title.

6. Style: minimal, clean. Each column has a subtle --surface-2 background. Cards use --surface with --border. Active drag shows --accent border. Smooth transitions.
```

---

## PROMPT 11 — Virality Predictor improvements

```
Improve the Virality Predictor in components/reels/ViralityPredictor.tsx.

1. Add a "Compare with your top reels" section below the prediction results:
   - Show the user's top 3 reels by multiplier with their scores
   - Highlight what the predicted content has in common with top performers
   - Show what's different/missing

2. Add format-specific tips:
   - After prediction, if the score is below 60, show 3 actionable AI-generated tips specific to the chosen format
   - Tips should reference patterns from the user's OWN top-performing content (pass top reel hooks/captions to the AI prompt)

3. Add prediction history:
   - Save each prediction to a Supabase table: prediction_history (id, account_id, hook, caption, format, duration, score, prediction_json, created_at)
   - Show last 5 predictions below the form with their scores
   - Allow re-editing a past prediction

4. Improve the form UX:
   - Auto-grow textarea for the caption
   - Character count for hook (recommended: 5-10 words)
   - Duration slider instead of text input (5s to 90s, with markers at common durations: 15s, 30s, 60s)
   - Format selector as visual cards instead of a dropdown
```

---

## PROMPT 12 — Dark/Light mode polish

```
Polish the dark/light theme implementation.

1. Audit globals.css for any hardcoded colors that don't use CSS variables. Replace ALL instances of:
   - Hardcoded hex colors (#fff, #000, #333, etc.) with appropriate --text, --bg, --surface variables
   - rgba(0,0,0,x) with proper theme-aware alternatives
   - Any inline styles in components that use hardcoded colors

2. The landing page (app/page.tsx) has extensive inline styles with hardcoded colors (#000, #0a0a0a, #fff, #888, #222, etc.). Replace them all with CSS classes that use theme variables so the landing page works in both themes.

3. Add a smooth transition when switching themes:
   - Add transition: background-color 200ms ease, color 200ms ease to body and major containers
   - The ThemeToggle should animate the icon (sun/moon) with a rotation

4. Check these specific components for theme issues:
   - MockupBrowser in the landing page (uses hardcoded dark colors)
   - Score rings in ViralityPredictor and ProfileScore
   - Chart colors in DashboardCharts
   - The MokaChat floating button

5. Ensure the theme preference is saved in localStorage and applied before first paint (prevent flash of wrong theme).
```
