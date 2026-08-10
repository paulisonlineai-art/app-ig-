# Klar App — Full Redesign Prompts (Claude Code)

Run these prompts **in order** in Claude Code. Each builds on the previous.
Before starting, make sure `middleware.ts` is committed and pushed:
```bash
git add middleware.ts
git commit -m "add middleware for auth guard"
git push
```

---

## PROMPT R0 — Push middleware.ts + Fix sync insights

```
Two critical fixes before the redesign:

1. Verify middleware.ts exists at root with this content:
export { proxy as middleware } from './proxy'
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

If it doesn't exist, create it. Then commit and push it.

2. Fix lib/sync.ts — after syncing each reel's basic data (views, likes, comments), also fetch insights for each reel using getMediaInsights() from lib/instagram.ts. Map the fields:
   - plays → views (overwrite the basic field count with insights data if available)
   - saved → saves
   - shares → shares
   - reach → reach (add this column to reels table if not exists)
   - total_interactions → total_interactions (add column if not exists)

   Generate a SQL migration to add columns: reach (integer default 0), total_interactions (integer default 0) to the reels table.

   In the sync loop, after inserting/updating each reel, call:
   const insights = await getMediaInsights(accessToken, reel.id)
   Then update the reel row with the insights data.

   Handle rate limits: if insights call fails with rate limit error, wait 60 seconds and retry once. If it fails again, skip insights for that reel and continue.

3. In proxy.ts, make sure the auth guard sets the ig_account_id cookie correctly after a user logs in. Verify the logic flow:
   - User hits any dashboard route
   - proxy.ts checks for Supabase session
   - If session exists, query ig_accounts for that user_id
   - If ig_account found, set ig_account_id cookie
   - If no ig_account, redirect to /connect

Do NOT change the UI — only backend fixes.
```

---

## PROMPT R1 — Design system foundation + New color palette

```
Create a professional design system. The current UI uses emoji icons and basic styling. Replace it with a clean, modern SaaS look inspired by Linear, Notion, and Stripe Dashboard.

### 1. New color palette in globals.css

Replace the current :root variables with:

:root, [data-theme="light"] {
  /* Backgrounds */
  --bg: #FAFBFC;
  --surface: #FFFFFF;
  --surface-2: #F4F5F7;
  --surface-3: #EBECF0;
  --surface-hover: #F8F9FB;
  --border: #E1E4E8;
  --border-strong: #D1D5DA;

  /* Brand — deep blue primary, electric blue accent */
  --primary: #1A56DB;
  --primary-light: rgba(26,86,219,0.08);
  --primary-mid: #3B82F6;
  --primary-dark: #1E40AF;
  --primary-text: #FFFFFF;

  --accent: #6366F1;  /* indigo for secondary actions */
  --accent-light: rgba(99,102,241,0.08);

  /* Text */
  --text: #1F2937;
  --text-secondary: #4B5563;
  --text-muted: #6B7280;
  --text-faint: #9CA3AF;

  /* Status */
  --success: #059669;
  --success-bg: rgba(5,150,105,0.08);
  --success-light: #D1FAE5;
  --warning: #D97706;
  --warning-bg: rgba(217,119,6,0.08);
  --danger: #DC2626;
  --danger-bg: rgba(220,38,38,0.06);

  /* Shadows — layered for depth */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04);
  --shadow-md: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03);
  --shadow-lg: 0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.03);

  /* Radius */
  --radius-sm: 6px;
  --radius: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition: 200ms ease;
  --transition-slow: 300ms ease;
}

[data-theme="dark"] {
  --bg: #0F1117;
  --surface: #1A1D27;
  --surface-2: #22252F;
  --surface-3: #2A2D37;
  --surface-hover: #1E2130;
  --border: #2D3039;
  --border-strong: #3D4049;

  --primary: #3B82F6;
  --primary-light: rgba(59,130,246,0.12);
  --primary-dark: #2563EB;

  --accent: #818CF8;
  --accent-light: rgba(129,140,248,0.12);

  --text: #F3F4F6;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  --text-faint: #6B7280;

  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow: 0 4px 6px rgba(0,0,0,0.4);
  --shadow-md: 0 10px 15px rgba(0,0,0,0.4);
  --shadow-lg: 0 20px 25px rgba(0,0,0,0.4);
}

### 2. Create components/ui/Icon.tsx

Create an icon system using Lucide React icons. Install lucide-react:
npm install lucide-react

Create a mapping file components/ui/icons.ts that exports named icon components for the sidebar nav:
- Home (Inicio)
- Play (Mis Reels)
- BarChart3 (Análisis)
- Sparkles (Crear)
- Kanban (Pipeline)
- Eye (Espía)
- Calendar (Calendario)
- DollarSign (Ventas)
- Fingerprint (Mi Marca)
- Settings (Configuración)
- Users (Clientes) — NEW
- Phone (Llamadas) — NEW
- Target (Radar Competencia) — NEW
- Bell (Notificaciones)
- LogOut

### 3. Create components/ui/Card.tsx

A reusable card component with variants:
- default: white bg, subtle border, shadow-xs
- elevated: shadow-sm on hover scales to shadow
- interactive: hover state with slight translateY(-1px) and shadow transition
- ghost: transparent bg, dashed border

Props: padding ('none' | 'sm' | 'md' | 'lg'), className, children

### 4. Create components/ui/Badge.tsx

Status badges with variants:
- default (gray), primary (blue), success (green), warning (yellow), danger (red)
- Sizes: sm, md
- Dot variant (small colored dot + text)

### 5. Create components/ui/Button.tsx

Professional button component:
- Variants: primary, secondary, ghost, danger, outline
- Sizes: xs, sm, md, lg
- States: loading (spinner), disabled
- Icon support: leftIcon, rightIcon props
- Use var(--primary) for primary variant
- Subtle hover transitions (brightness, shadow)
- NO emoji — use Lucide icons only

### 6. Create components/ui/Table.tsx

Reusable data table component:
- Clean rows with hover highlighting
- Sortable column headers (click to sort asc/desc, show arrow indicator)
- Optional row click handler
- Sticky header
- Striped option
- Responsive: horizontal scroll on mobile
- Consistent typography: 13px body, 11px uppercase headers, --text-muted for headers

### 7. Create components/ui/KPICard.tsx

KPI card for dashboard metrics:
- Large number (24px, font-weight 700, --text)
- Label below (12px, --text-muted, uppercase tracking)
- Optional trend indicator: green up arrow + % or red down arrow + %
- Optional sparkline (tiny inline chart)
- Subtle left border with color coding
- Hover: slight glow with the border color

### 8. Create components/ui/Skeleton.tsx

Loading skeleton with variants: text, card, chart, table-row, avatar, badge
Pulse animation using --surface-2 and --surface-3.

### 9. Update globals.css with new base styles:

- body: font-family 'Inter', -apple-system, sans-serif; font-size 14px; line-height 1.5; -webkit-font-smoothing antialiased
- Remove ALL emoji-related styles
- Clean typography scale: h1 24px/700, h2 18px/600, h3 15px/600, body 14px/400, small 12px/400, caption 11px/500
- Add Inter font import via next/font/google in app/layout.tsx (do NOT use Google Fonts CDN link)

Do NOT change any page content yet — only create the design system files and update globals.css colors/typography. All existing pages should still render (they'll just look different with the new colors).
```

---

## PROMPT R2 — Sidebar + Layout redesign

```
Redesign the dashboard layout with a professional sidebar inspired by Linear/Notion.

### 1. Update app/(dashboard)/layout.tsx sidebar

Replace the current emoji-based nav with Lucide icons from the icon system created in R1.

New nav structure (update NAV_TOP):
const NAV_SECTIONS = [
  {
    label: null, // no section header for main nav
    items: [
      { href: '/dashboard', label: 'Inicio', icon: 'Home' },
      { href: '/reels', label: 'Mis Reels', icon: 'Play' },
      { href: '/rayos-x', label: 'Análisis', icon: 'BarChart3' },
    ]
  },
  {
    label: 'Contenido',
    items: [
      { href: '/crear', label: 'Crear', icon: 'Sparkles' },
      { href: '/pipeline', label: 'Pipeline', icon: 'Kanban' },
      { href: '/calendario', label: 'Calendario', icon: 'Calendar' },
    ]
  },
  {
    label: 'Negocio',
    items: [
      { href: '/radar', label: 'Radar IG', icon: 'Target' },
      { href: '/llamadas', label: 'Llamadas', icon: 'Phone' },
      { href: '/clientes', label: 'Clientes', icon: 'Users' },
      { href: '/ventas', label: 'Ventas', icon: 'DollarSign' },
    ]
  },
]

Note: /radar replaces /espia (same component, new route and name). /llamadas and /clientes are NEW pages (create placeholder pages for now).

### 2. Sidebar design (update globals.css):

- Width: 240px (collapsible to 64px icon-only on desktop)
- Background: var(--surface)
- Border-right: 1px solid var(--border)
- NO shadow on sidebar
- Profile section at top: avatar (36px), username, followers count — compact
- Section headers: 11px uppercase, --text-faint, letter-spacing 0.05em, padding 20px 16px 6px
- Nav items: 13px, --text-secondary, 32px height, 8px border-radius, 8px horizontal padding
- Active nav item: --primary-light bg, --primary text color, font-weight 500
- Hover nav item: --surface-hover bg
- Icon size: 18px, --text-muted color (--primary when active)
- Collapse toggle button at bottom of sidebar (ChevronLeft icon, rotates when collapsed)
- Bottom section: Mi Marca, Configuración, Logout — separated by a subtle border-top

### 3. Topbar redesign:

- Remove the topbar KPI values (they clutter the header)
- Topbar should be minimal: left side shows breadcrumb-style page title (e.g. "Inicio" or "Mis Reels > Detalle")
- Right side: SyncButton (show last sync time), NotificationBell placeholder, ThemeToggle
- Height: 52px
- Background: var(--bg) (transparent feel)
- Border-bottom: 1px solid var(--border)

### 4. Content area:

- Max-width: 1200px
- Padding: 24px 32px
- Centered with margin auto
- Page enter animation: opacity 0→1, translateY(4px→0), 200ms ease-out

### 5. MobileNav update:

- Hamburger icon (Menu from Lucide) replaces current toggle
- Full-screen overlay on mobile with same nav structure
- Close button (X icon) top-right
- Smooth slide-in from left

### 6. Create placeholder pages:

- app/(dashboard)/radar/page.tsx — redirect or copy from espia
- app/(dashboard)/llamadas/page.tsx — empty state "Llamadas de venta — Próximamente"
- app/(dashboard)/clientes/page.tsx — empty state "Gestión de clientes — Próximamente"

Rename the espia route: keep app/(dashboard)/espia/page.tsx working but add a redirect from /espia to /radar. Or simply rename the folder to radar.
```

---

## PROMPT R3 — Dashboard page redesign

```
Completely redesign app/(dashboard)/dashboard/page.tsx and its components.

### Reference design (Francisco Doglio style):
- Top row: 4-5 large KPI cards in a grid
- Below: Charts section with tabs or side-by-side
- Clean white cards, plenty of whitespace, data-focused

### 1. Dashboard page layout:

Section 1 — KPI Cards Row (grid, 4 columns on desktop, 2 on tablet, 1 on mobile):
- Vistas Totales (total views last 30d) — icon: Eye, color: blue
- Engagement Rate (%) — icon: Heart, color: pink  
- Alcance Total (total reach last 30d) — icon: Users, color: green
- Guardados Totales (total saves last 30d) — icon: Bookmark, color: purple

Each KPI card uses the KPICard component from R1:
- Big number, formatted (1.5K, 23.4K, 1.2M)
- Trend vs previous 30d period (green +12% or red -5%)
- Subtle colored left border matching the icon color

Section 2 — Charts (2-column grid on desktop, stacked on mobile):
- Left: "Rendimiento de Reels" — bar chart showing views per reel (last 15 reels), x-axis = reel date, colored by performance (green if above avg, red if below)
- Right: "Engagement por Tipo" — horizontal bar chart showing avg likes, comments, saves, shares across all reels

Section 3 — "Mejores Reels" (top 5 reels by views):
- Use Table component: columns = Thumbnail (40x40 rounded), Caption (truncated), Views, Likes, Comments, Saves, Fecha
- Row click navigates to /reels/[id]
- Sortable by any metric column

Section 4 — "Actividad Reciente" (timeline):
- Last 5 sync events or reel publications
- Simple list: dot indicator + description + relative time

### 2. Update components/dashboard/DashboardCharts.tsx:
- Use Recharts (already installed) with the new color palette
- Chart backgrounds transparent, grid lines using --border at 0.5 opacity
- Tooltips: --surface bg, --border, --shadow-sm, 12px text
- Bar colors: var(--primary) for main, var(--primary-light) for secondary

### 3. Remove or replace components/dashboard/ProfileScore.tsx:
- The "score" concept is too generic. Remove it from the dashboard.
- Replace with the KPI cards above.

### 4. Update components/dashboard/SyncButton.tsx:
- Use the new Button component (variant="outline", size="sm")
- Icon: RefreshCw from Lucide (animate spin when syncing)
- Text: "Sincronizar" (not emoji)
- Show last sync time in gray text next to button

### 5. Remove DateRangeSelect.tsx:
- Replace with a simpler period selector: "7d | 30d | 90d" toggle buttons
- Default to 30d
- Style as segmented control (connected buttons, active one has --primary bg)

### 6. Update the page's data fetching:
- Fetch KPI data for current period AND previous period (for trend calculation)
- Fetch top 5 reels by views
- Fetch chart data (last 15 reels with all metrics)
- Use Promise.all for parallel queries

Keep all text in Spanish.
```

---

## PROMPT R4 — Reels list + detail page redesign

```
Redesign the Reels pages for a cleaner, more data-rich experience.

### 1. app/(dashboard)/reels/page.tsx — Reels list

Top section:
- Page title "Mis Reels" with reel count badge
- Filter bar: period selector (7d/30d/90d/all), sort dropdown (Más vistas, Más recientes, Mejor engagement), search input
- View toggle: Grid view / List view (table)

Grid view (default):
- 3 columns desktop, 2 tablet, 1 mobile
- Each card: thumbnail (16:9 aspect ratio, rounded-lg), caption (2 lines truncated), metrics row (views, likes, comments, saves — with icons, not labels)
- Hover: shadow elevation, slight scale
- Click navigates to detail

List/Table view:
- Table with columns: Thumbnail (small), Caption, Views, Likes, Comments, Saves, Shares, Engagement Rate, Fecha
- Sortable columns
- Hover row highlight

Pagination: "Cargar más" button (load 24 at a time)

### 2. app/(dashboard)/reels/[id]/page.tsx — Reel detail

Redesign ReelDetailClient.tsx:

Top: Back button (← Volver a reels), reel caption as title

Two-column layout on desktop:

Left column (60%):
- Reel embed/thumbnail (large)
- Caption (full text)
- Hashtags extracted and shown as badges
- Link to Instagram (external link icon)

Right column (40%):
- KPI grid (2x2): Views, Likes, Comments, Saves — each with KPICard
- Below KPIs: "Rendimiento vs Promedio" — bar chart comparing this reel's metrics to account average
- "Engagement Rate" with colored indicator (green if above avg, yellow if avg, red if below)
- Reach and Shares stats (if available)

Below both columns:
- AI Analysis section (if already analyzed):
  - Card with the analysis text, nicely formatted
  - "Analizar con IA" button if not yet analyzed
- Benchmark comparison chart (BenchmarkChart.tsx — keep existing logic, update styling)

### 3. Update components:

- ReelsGrid.tsx: Implement the new card design with consistent spacing
- ReelsChart.tsx: Update colors and tooltip styling
- Remove FlopAutopsy.tsx, HookLab.tsx, ViralityPredictor.tsx from the detail page — move them to /rayos-x (analysis page) where they belong
- Remove RecyclableContent.tsx — not useful enough

Keep all text in Spanish.
```

---

## PROMPT R5 — Radar de Competencia IG (competitor tracking)

```
Build the "Radar de Competencia IG" page — a competitor ranking and tracking system.

### Reference (Jose Manuel Correa's Nexus Creators):
- Table showing competitors ranked by comments (leads), with CTA type, views, fecha
- KPI cards at top: Total comments summed, most commented account, avg comments per reel, your best reel
- Filter: "Mi radar" vs "Radar global", date range, search

### 1. Rename app/(dashboard)/espia/ folder to app/(dashboard)/radar/

Update all references. Add a redirect from /espia to /radar in Next.js middleware or via a page that redirects.

### 2. Redesign the page:

Top KPI row (4 cards):
- "Comentarios Totales" — sum of comments across all tracked competitors' recent reels
- "Más Comentado" — competitor with most comments, show their username
- "Promedio Comentarios/Reel" — average across all competitors
- "Tu Mejor Reel" — your reel with most comments, with count

Filter bar:
- Toggle: "Mi Radar" (your tracked competitors) / "Todos" (global search)
- Period: "7d | 30d | 90d"
- Search input to filter by username

### 3. Competitor ranking table:

Columns:
- # (rank)
- Cuenta (profile pic + username)
- CTA Tipo (badge: "DASHBOARD", "VIDEO", "SLIDE", "GIFT", "LINK", "NONE" — categorize based on caption keywords or manual tagging)
- Comentarios (number, sorted desc by default)
- Views
- Engagement (comments/views %)
- Fecha (last reel date)

Table features:
- Sortable by any column
- Row click opens competitor detail (shows their recent reels)
- Add competitor button (+ icon) opens AddCompetitorForm in a modal
- Remove competitor (trash icon, with confirm)

### 4. Create the CTA categorization:

In lib/instagram.ts or a new lib/cta-classifier.ts, add a function:
classifyCTA(caption: string): 'DASHBOARD' | 'VIDEO' | 'LLAMA' | 'SLIDE' | 'GIFT' | 'LINK' | 'SKILLS' | 'FORMATOS' | 'CTA' | 'GUIA' | 'NONE'

Rules (check caption for keywords):
- Contains "link" or "enlace" or URL → 'LINK'
- Contains "llama" or "agenda" or "llamada" → 'LLAMA'  
- Contains "comenta" + a keyword → 'CTA' (comment-to-get CTA)
- Contains "dashboard" or "software" or "herramienta" → 'DASHBOARD'
- Contains "video" or "mira" → 'VIDEO'
- Contains "regalo" or "gratis" or "free" → 'GIFT'
- Contains "slides" or "carrusel" → 'SLIDE'
- Contains "guía" or "guia" or "ebook" → 'GUIA'
- Otherwise → 'NONE'

Style each CTA type as a colored badge.

### 5. Competitor detail modal/page:

When clicking a competitor row, show:
- Their profile info (pic, username, followers, bio)
- Grid of their recent reels (thumbnails + metrics)
- "Guardar reel" button on each (saves to your references)
- "Adaptar con IA" button (existing adapt functionality)

### 6. Supabase updates:

Add column to competitor_reels table: cta_type text default 'NONE'
Run classifyCTA on each competitor reel during sync and store the result.

Keep all text in Spanish.
```

---

## PROMPT R6 — Llamadas de Venta (Sales Call Tracking)

```
Build the "Llamadas de Venta" page — a CRM for tracking and analyzing sales calls with AI.

### Reference (Jose Manuel Correa's Nexus Creators):
- Calendar/list view of sales calls (Llamadas de Consultoría, Admisiones, etc.)
- Detailed call analysis with sections: Momento Decisivo, Por Qué Ese Resultado, Objeciones (with cards), Aciertos, Errores
- Clean white background, colored section headers

### 1. Create Supabase migration — sales_calls table:

CREATE TABLE sales_calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id text REFERENCES ig_accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  client_name text,
  client_email text,
  call_date timestamptz NOT NULL,
  duration_minutes integer,
  call_type text CHECK (call_type IN ('consultoría', 'admisión', 'seguimiento', 'cierre', 'otro')),
  result text CHECK (result IN ('vendido', 'no_vendido', 'seguimiento', 'no_show', 'pendiente')),
  amount decimal(10,2),
  notes text,
  audio_url text,
  transcript text,
  ai_analysis jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sales_calls_account ON sales_calls(account_id, call_date DESC);

RLS: users can only CRUD their own calls (via account_id matching ig_account_id cookie pattern).

### 2. Create app/(dashboard)/llamadas/page.tsx

Top section:
- Page title "Llamadas de Venta"
- KPI row: Total llamadas (this month), Tasa de cierre (%), Ingresos generados, Promedio duración

Tabs: "Agenda" | "Llamadas" (list view)

Agenda tab:
- Calendar-style list grouped by date (like the reference)
- Each entry: time, title, client name, call type badge, result badge (colored)
- Click opens call detail

Llamadas tab:
- Table: Fecha, Cliente, Tipo, Duración, Resultado, Monto, Acciones
- Sortable, filterable by result and type

Add call button (top right): Opens modal with form fields for all call properties.

### 3. Create app/api/calls/ routes:

- GET /api/calls — list calls for current account, with optional filters (date range, result, type)
- POST /api/calls — create new call
- PATCH /api/calls/[id] — update call
- DELETE /api/calls/[id] — delete call
- POST /api/calls/[id]/analyze — trigger AI analysis of the call

### 4. AI Call Analysis (POST /api/calls/[id]/analyze):

Use the existing Anthropic client from lib/ai.ts.

Prompt for analysis (the call must have notes or a transcript):
"Analiza esta llamada de venta y genera un análisis estructurado en JSON con estos campos:
- momento_decisivo: string — el momento clave que definió el resultado
- por_que_resultado: string — explicación de por qué se obtuvo ese resultado
- objeciones: array of { titulo: string, descripcion: string, mejora: string } — cada objeción del prospecto, cómo se manejó, y cómo mejorar
- aciertos: array of string — lo que se hizo bien
- errores: array of string — lo que se puede mejorar
- puntuacion: number (1-10) — score general de la llamada
- resumen: string — resumen de 2 oraciones"

Store the parsed JSON in ai_analysis column.

### 5. Call detail page — app/(dashboard)/llamadas/[id]/page.tsx

Layout matching the reference:
- Header: call title, date, client, result badge, duration
- "Momento Decisivo" section (blue header background)
- "Por Qué Ese Resultado" section (green header)
- "Objeciones" section (red header): grid of cards, each with title, description, and "Mejora:" suggestion
- "Aciertos" section (green header): list with checkmark icons
- "Errores" section (red header): list with X icons
- Puntuación: large number with colored ring

Each section header uses a colored background strip (blue/green/red) with white text — matching the reference screenshots.

If no analysis exists yet, show "Analizar con IA" button prominently.

### 6. Components:

- components/llamadas/CallForm.tsx — modal form for add/edit
- components/llamadas/CallCard.tsx — list item in agenda view
- components/llamadas/CallAnalysis.tsx — renders the AI analysis sections

Keep all text in Spanish.
```

---

## PROMPT R7 — Clientes (Client Management)

```
Build the "Clientes" page — client management and team.

### Reference (Jose Manuel Correa's Nexus Creators):
- Equipo section: table with team members, roles (Fundador, co propietario, closer), Calendly emails
- Invitaciones section: role-based invite links (Admin, Closer, Co-Owner, Viewer)
- Todos los Clientes section: table with client name, email, monto, plazos, pagos, periodo, país

### 1. Create Supabase migration — clients table:

CREATE TABLE clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id text REFERENCES ig_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  instagram text,
  source text CHECK (source IN ('instagram', 'referido', 'ads', 'organico', 'otro')),
  status text CHECK (status IN ('lead', 'prospecto', 'cliente', 'ex_cliente')) DEFAULT 'lead',
  amount decimal(10,2),
  payment_plan text,
  payments_made integer DEFAULT 0,
  payments_total integer DEFAULT 1,
  start_date date,
  end_date date,
  country text,
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_account ON clients(account_id, status);

RLS: standard account_id matching.

### 2. Create app/(dashboard)/clientes/page.tsx

Top KPI row:
- Total clientes activos
- Ingresos recurrentes (sum of active client amounts)
- Nuevos este mes
- Tasa de retención (clients not churned / total)

Tabs: "Clientes" | "Pipeline"

Clientes tab:
- Table: Nombre, Email, Instagram, Estado (badge), Monto, Pagos (2 de 3), Periodo, País (flag emoji), Acciones
- Status filter: All, Lead, Prospecto, Cliente, Ex-cliente
- Search by name/email
- Row click opens client detail panel (slide-in from right)
- Add client button

Pipeline tab:
- Kanban-style board with columns: Lead → Prospecto → Cliente
- Cards show: name, amount, source badge
- Drag and drop to change status (use simple drag handlers, no library needed — or use @hello-pangea/dnd if already installed, otherwise keep it simple with button-based status changes)

### 3. Create API routes:

- GET /api/clients — list with filters
- POST /api/clients — create
- PATCH /api/clients/[id] — update
- DELETE /api/clients/[id] — delete

### 4. Client detail panel:

Slide-in panel from right (not a new page):
- Client info (name, email, phone, Instagram link)
- Status selector (dropdown to change status)
- Payment progress bar (pagos_made / pagos_total)
- Notes (editable textarea)
- Tags (editable tag input)
- Activity log: linked sales calls (from sales_calls table where client_email matches)
- "Llamar" button (links to /llamadas with pre-filled client)

### 5. Components:

- components/clientes/ClientTable.tsx
- components/clientes/ClientForm.tsx (modal)
- components/clientes/ClientDetail.tsx (slide-in panel)
- components/clientes/ClientPipeline.tsx (kanban view)

Keep all text in Spanish.
```

---

## PROMPT R8 — Calendario redesign

```
Redesign the Calendario page to match the reference (Jose Manuel Correa's calendar).

### Reference:
- Full monthly calendar grid
- Tasks shown as colored blocks on days
- "Nueva tarea" button (blue, top right)
- Tasks color-coded by type
- Clean grid with day numbers

### 1. Create Supabase migration — calendar_tasks table:

CREATE TABLE calendar_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id text REFERENCES ig_accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  type text CHECK (type IN ('contenido', 'llamada', 'tarea', 'grabacion', 'publicar', 'otro')) DEFAULT 'tarea',
  priority text CHECK (priority IN ('alta', 'media', 'baja')) DEFAULT 'media',
  completed boolean DEFAULT false,
  linked_reel_id uuid,
  linked_call_id uuid,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

### 2. Redesign app/(dashboard)/calendario/page.tsx

Header:
- Month/year navigation (< Julio 2026 >)
- View toggle: "Mes | Semana | Lista"
- "Nueva tarea" button (primary, + icon)

Month view (default):
- 7-column grid (Lun-Dom headers)
- Each day cell: day number top-left, tasks below as colored pills
- Task pill: colored left border matching type, truncated title, 11px text
- Click on task opens detail modal
- Click on empty day opens "add task" with date pre-filled
- Today highlighted with --primary colored number
- Overflow: if >3 tasks, show "+2 más" link

Type colors:
- contenido: #3B82F6 (blue)
- llamada: #F59E0B (amber)
- grabacion: #EF4444 (red)
- publicar: #10B981 (green)
- tarea: #8B5CF6 (purple)
- otro: #6B7280 (gray)

Week view:
- 7-column grid showing one week
- More vertical space per day
- Shows time + title for each task

List view:
- Grouped by date
- Each task: checkbox (toggles completed), time, title, type badge, priority indicator

### 3. Task modal (add/edit):

Form fields: título, descripción, fecha, hora, tipo (dropdown), prioridad (dropdown), color picker
- Optional: link to reel (dropdown of your reels) or link to call

### 4. API routes:

- GET /api/calendar — tasks for date range (month)
- POST /api/calendar — create task
- PATCH /api/calendar/[id] — update task
- DELETE /api/calendar/[id] — delete task

### 5. Components:

- components/calendario/CalendarGrid.tsx (client component with state for month/week/list)
- components/calendario/CalendarDay.tsx
- components/calendario/TaskForm.tsx (modal)
- components/calendario/TaskPill.tsx

Make this fully client-side for interactivity — the page.tsx server component just passes initial data.

Keep all text in Spanish.
```

---

## PROMPT R9 — Análisis (Rayos X) page enhancement

```
Enhance the Análisis page with the features from the reference apps.

### Reference (Francisco Doglio):
- Interacciones vs Benchmark 90D: Me gusta, Guardados, Comentarios, Compartidos — each showing actual % vs benchmark %
- Ratios Clave: Views Paid/Views Totales, Reach Paid/Reach Total, Saves/Views
- Split Orgánico/Pagado: Views and Reach broken down
- Retención: avg retention %, watch time, duration, avg seconds
- Día con más views: bar chart by day of week

### 1. Redesign app/(dashboard)/rayos-x/page.tsx

Section 1 — "Interacciones vs Benchmark" (card):
- 4 metric comparisons in a row: Me gusta, Guardados, Comentarios, Compartidos
- Each shows: metric name, current value (6.6K), current rate (3.05%), benchmark rate, and a progress bar comparing the two
- Color: green if above benchmark, red if below
- Benchmark = average of your last 90 days

Section 2 — "Ratios Clave" (card):
- Saves/Views ratio
- Comments/Views ratio  
- Shares/Views ratio
- Each shown as a percentage with a small indicator dot (green/yellow/red based on thresholds)

Section 3 — "Mejor Día para Publicar" (card):
- Bar chart: x-axis = days of week (Lun-Dom), y-axis = avg views
- Highlight the best day
- Below chart: "Tu mejor día es [Miércoles] con un promedio de [X] views"

Section 4 — "Mejor Hora para Publicar" (card):
- Heatmap or bar chart showing avg views by hour (group reels by publication hour)

Section 5 — "Retención" (card, if we have the data):
- Average watch time
- Average duration
- Retention rate (watch time / duration)
- If we don't have retention data from the API, show this section as "Próximamente" with a lock icon

Section 6 — Move HookLab and ViralityPredictor here:
- "Laboratorio de Hooks" — the existing HookLab.tsx, restyled with new components
- "Predictor de Viralidad" — the existing ViralityPredictor.tsx, restyled

Section 7 — "Patrones de Contenido":
- The existing ReelPatterns.tsx, restyled
- Shows which content patterns perform best

### 2. Calculate benchmarks:

In the page's server component, calculate:
- avgLikes, avgComments, avgSaves, avgShares across last 90d
- avgViews across last 90d
- Rates: likes/views, comments/views, saves/views, shares/views
- Best day of week (group reels by day of week, avg views per day)
- Best hour (group reels by hour of timestamp, avg views per hour)

### 3. Components to update:
- components/reels/ReelPatterns.tsx → restyle with Card component
- components/reels/HookLab.tsx → restyle with Card + Button components
- components/reels/ViralityPredictor.tsx → restyle with Card + Button components

Remove FlopAutopsy.tsx if not useful, or restyle and move here.

Keep all text in Spanish.
```

---

## PROMPT R10 — Ventas page redesign + Pipeline

```
Redesign the Ventas page to be more comprehensive.

### 1. app/(dashboard)/ventas/page.tsx

Top KPI row:
- Facturación total (all time)
- Facturación este mes
- Ticket promedio
- Clientes activos

Charts section (2-column):
- Left: "Facturación Mensual" — line chart showing revenue by month (last 12 months)
- Right: "Fuentes de Ingreso" — pie/donut chart showing revenue by source (Instagram, Referido, Ads, etc.)

Sales table:
- Table: Fecha, Cliente, Concepto, Monto, Fuente, Estado (badge)
- Filter by date range and source
- Add sale button → opens AddSaleForm modal

### 2. app/(dashboard)/pipeline/page.tsx redesign

Content pipeline for tracking reel ideas → production → published:
- Kanban board with columns: Idea → Guión → Grabación → Edición → Publicado
- Cards: title, brief description, assigned date, linked reel (if published)
- Add idea button
- Drag between columns or button-based status changes

### 3. Update AddSaleForm with link to client (dropdown of existing clients from clients table).

### 4. Connect ventas data with clientes data:
- When adding a sale, optionally link to a client
- In client detail, show their purchase history

Keep all text in Spanish.
```

---

## PROMPT R11 — Landing page + Connect page redesign

```
Redesign the landing page (app/page.tsx) and connect page (app/connect/) for a professional first impression.

### 1. Landing page (app/page.tsx):

Clean, modern SaaS landing page:

Hero section:
- Headline: "Analítica de Instagram que impulsa tu negocio"
- Subheadline: "Métricas en tiempo real, análisis con IA, y herramientas de venta — todo en un solo lugar."
- CTA button: "Comenzar gratis" → links to /connect
- Optional: screenshot/mockup of the dashboard (use a simple CSS-drawn representation, no actual image needed)

Features section (3-column grid):
- "Métricas en Tiempo Real" — icon: BarChart3 — "Sincroniza tu cuenta y ve todas tus métricas actualizadas al instante."
- "Análisis con IA" — icon: Sparkles — "Obtén insights automáticos sobre tu contenido y encuentra patrones de viralidad."
- "Radar de Competencia" — icon: Target — "Monitorea a tus competidores y descubre qué CTAs generan más leads."

Pricing section (optional, simple):
- "Gratis durante beta" — full access, no limits
- "Premium (próximamente)" — advanced features

Footer:
- "Hecho con ❤ por Klar" — minimal

Design:
- White background, lots of whitespace
- --primary blue accents
- Subtle gradient on hero (white to --surface-2)
- No emojis in the professional sections — use Lucide icons

### 2. Connect page redesign:

After Google login, the connect page should be clean and guiding:
- Step indicator: 1. Login ✓  →  2. Conectar Instagram  →  3. Dashboard
- Large Instagram icon
- Clear CTA: "Conectar cuenta de Instagram"
- Note: "Requiere una cuenta de Instagram Business o Creator"
- What you'll get: 3 bullet points with icons (Métricas completas, Insights de audiencia, Análisis con IA)
- "¿Por qué necesitamos acceso?" expandable FAQ

### 3. Login page (app/login/page.tsx if it exists):

- Center card with Klar logo
- "Inicia sesión con Google" button (Google branded)
- Clean, minimal, professional
- Remove any old login methods

Use the Inter font and new color palette throughout.
Keep all text in Spanish.
```

---

## PROMPT R12 — Performance + Polish

```
Final polish pass on the entire app.

### 1. Loading states:

Add loading.tsx to every dashboard route with appropriate skeletons:
- /dashboard/loading.tsx — 4 skeleton KPI cards + 2 skeleton charts
- /reels/loading.tsx — skeleton grid (6 card skeletons)
- /radar/loading.tsx — skeleton table (10 rows)
- /llamadas/loading.tsx — skeleton list (8 items)
- /clientes/loading.tsx — skeleton table (10 rows)
- /calendario/loading.tsx — skeleton calendar grid
- /ventas/loading.tsx — skeleton KPIs + skeleton chart
- /rayos-x/loading.tsx — skeleton cards (6)
- /crear/loading.tsx — skeleton tabs
- /pipeline/loading.tsx — skeleton kanban (4 columns)
- /marca/loading.tsx — skeleton form
- /configuracion/loading.tsx — skeleton form

### 2. Empty states:

Replace ALL emoji-based empty states with proper illustrations:
- Create components/ui/EmptyState.tsx
- Props: icon (Lucide icon), title, description, action (optional button)
- Design: centered, icon at 48px in --text-faint, title 16px --text, description 14px --text-muted
- Use for: no reels, no competitors, no calls, no clients, no tasks, etc.

### 3. Error boundary:

Update app/(dashboard)/error.tsx:
- Professional error page with illustration
- "Algo salió mal" heading
- Error message (simplified, not raw)
- "Reintentar" button + "Volver al inicio" link

### 4. generateMetadata for all pages:

Add generateMetadata export to every page:
- Dashboard: "Inicio — Klar"
- Reels: "Mis Reels — Klar"
- Análisis: "Análisis — Klar"
- etc.

### 5. Responsive audit:

Check every page at 3 breakpoints (mobile 375px, tablet 768px, desktop 1280px):
- KPI grids: 1 col mobile, 2 tablet, 4 desktop
- Tables: horizontal scroll on mobile
- Charts: full width on mobile, min-height 200px
- Sidebar: hidden on mobile, hamburger menu
- Forms/modals: full width on mobile

### 6. Page transitions:

Add to globals.css:
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.dashboard-content {
  animation: pageEnter 200ms ease-out;
}

### 7. Image optimization:

In next.config.ts, add Instagram CDN domains:
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.cdninstagram.com' },
    { protocol: 'https', hostname: '**.fbcdn.net' },
  ]
}

Replace <img> tags for Instagram images with next/image <Image>.

### 8. Final CSS cleanup:

Remove all unused CSS from globals.css. Remove old styles that reference:
- .moka- prefix (old branding)
- emoji-related styles
- Old color variables that were replaced
- Unused component styles

Ensure dark mode works consistently across all new components.

Keep all text in Spanish.
```

---

## Execution order summary

| # | Prompt | What it does |
|---|--------|-------------|
| R0 | Fix middleware + sync insights | Backend fixes, no UI |
| R1 | Design system | Colors, icons, UI components |
| R2 | Layout + Sidebar | New navigation structure |
| R3 | Dashboard | KPI cards, charts, top reels |
| R4 | Reels pages | Grid/table views, detail page |
| R5 | Radar IG | Competitor ranking table |
| R6 | Llamadas | Sales call tracking + AI analysis |
| R7 | Clientes | Client management + pipeline |
| R8 | Calendario | Full calendar with tasks |
| R9 | Análisis | Advanced metrics + benchmarks |
| R10 | Ventas + Pipeline | Revenue tracking + content pipeline |
| R11 | Landing + Connect | Public-facing pages |
| R12 | Polish | Loading states, empty states, responsive |

**Estimated time per prompt**: 15-30 min each in Claude Code.
**Total**: ~4-6 hours for the full redesign.

**Important**: After each prompt, test locally with `npm run dev` before moving to the next. Deploy to Vercel after R2 to catch any build issues early.
