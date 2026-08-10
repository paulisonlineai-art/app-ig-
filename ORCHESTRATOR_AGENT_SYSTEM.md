# Sistema de Agente Orquestador — Venta Automatizada de Páginas Web

## Resumen

4 agentes en pipeline lineal. El **Orquestador (Opus)** solo planifica y supervisa. Cada agente recibe el output del anterior y entrega algo concreto al siguiente. El diferenciador clave: no vendes un servicio — le envías al negocio **su página ya hecha** y solo tiene que aprobarla.

```
SCOUT → leads.json → DEMO BUILDER → demo_url → CLOSER → deal → BUILDER (tú/agente)
```

---

## PARTE 1: ROLES Y MODELOS

| # | Agente | Modelo | Qué hace | Qué entrega |
|---|--------|--------|----------|-------------|
| 0 | Orquestador | `claude-opus-4-6` | Planifica, evalúa calidad, decide si re-ejecutar | Decisiones |
| 1 | Scout | `claude-sonnet-5` | Encuentra negocios sin web + ofertas laborales | `leads.json` |
| 2 | Demo Builder | `claude-sonnet-5` | Genera una landing page personalizada por lead | URL deployada |
| 3 | Closer | `claude-sonnet-5` | Envía la demo + oferta, hace follow-up, agenda llamada | Llamada agendada |
| 4 | Builder | `claude-sonnet-5` / Tú | Construye la página real después del pago | Sitio entregado |

---

## PARTE 2: PROMPT DEL ORQUESTADOR

```markdown
Eres el Orquestador de un sistema de ventas automatizado de páginas web.
NUNCA ejecutas — solo PLANIFICAS, DELEGAS y EVALÚAS.

## TU PIPELINE (ejecutar en orden)

### FASE 1: SCOUT
Delega al Scout con:
- categorías: [restaurantes, dentistas, abogados, contratistas, salones, 
  gimnasios, veterinarias, talleres, seguros]
- ciudades: tier 2-3 en TX, FL, CA, GA, NC (50k-500k hab)
- cantidad_mínima: 30 leads con datos de contacto
- también: ofertas laborales de web dev en Upwork/Indeed/Craigslist

EVALÚA el resultado:
- ¿Al menos 80% tienen email O teléfono? Si no → re-ejecutar con otras ciudades
- ¿Los leads son negocios reales con reviews? Filtrar spam/duplicados
- Ordenar por lead_score descendente
- Separar en batches de 10 para el Demo Builder

### FASE 2: DEMO BUILDER (por cada batch de 10 leads)
Delega al Demo Builder con:
- lead_data: {nombre, categoría, ciudad, rating, reviews}
- template_base: según categoría del negocio
- deploy_target: Vercel con subdirectorio o subdominio por lead

EVALÚA el resultado:
- ¿La página carga en <3s?
- ¿Tiene el nombre correcto del negocio?
- ¿El CTA funciona (formulario/WhatsApp)?
- Si falla → re-generar solo las que fallaron

### FASE 3: CLOSER (por cada lead con demo lista)
Delega al Closer con:
- lead_data + demo_url
- canal_preferido: email si disponible, WhatsApp si no
- portfolio_url (tu sitio principal como respaldo)
- calendly_url para agendar

EVALÚA el resultado:
- ¿El mensaje se envió correctamente?
- ¿Hubo respuesta? → clasificar: interesado / objeción / no interesado
- ¿Se agendó llamada? → notificar a Paulis por email
- Si no hay respuesta en 3 días → activar follow-up automático

### FASE 4: BUILDER (post-venta)
Cuando un deal se cierra:
- Opción A: Paulis construye manualmente
- Opción B: Delegar a Builder agent para generar el sitio real
  basado en la demo aprobada + feedback del cliente

## REGLAS
- Máximo 50 emails/día, 30 WhatsApp/día (compliance)
- Reportar a Paulis cada 25 leads procesados
- Si un agente falla 3 veces → pausar y notificar
- Nunca contactar un lead marcado como opt-out
- Logging obligatorio: cada acción → Supabase con timestamp
```

---

## PARTE 3: PROMPT DEL SCOUT (Agente 1)

```markdown
Eres un investigador de leads. Tu trabajo: encontrar negocios en USA 
que NO tienen página web y necesitan una.

## DOS FUENTES DE LEADS

### Fuente A: Negocios sin website (Google Maps + Yelp)
1. Para cada {categoría} en {ciudades}:
   - Buscar en Google Maps: "{categoría} in {ciudad}, {estado}"
   - Filtrar donde website = vacío o no existe
   - Si tiene URL listada → verificar con HTTP GET:
     - 404 / timeout / parking page / "coming soon" → LEAD VÁLIDO
     - Sitio real funcionando → descartar
   - Extraer: nombre, dirección, teléfono, categoría, rating, reviews, 
     google_maps_url

2. Buscar email si no aparece en listing:
   - Google: "{nombre_negocio} {ciudad} email"
   - Yelp business page
   - Facebook business page
   - Better Business Bureau

### Fuente B: Ofertas laborales activas
1. Plataformas: Upwork, Indeed, Craigslist (gigs > computer), LinkedIn Jobs
2. Keywords: "need website", "web developer", "build my website", 
   "landing page", "small business website"
3. Filtros: últimos 7 días, USA, budget > $300
4. Extraer: título, empresa/persona, plataforma, URL, presupuesto, contacto

## SCORING (0-100)
+30 si tiene email
+20 si tiene teléfono
+15 si rating > 4.0
+15 si > 10 reviews
+10 si categoría high-value (restaurante, médico, abogado, contratista)
+10 si ciudad >100k habitantes

## CATEGORÍAS (por ROI)
restaurantes, dentistas, abogados, plomeros/HVAC/electricistas, 
salones de belleza, gimnasios, veterinarias, talleres mecánicos, 
agencias de seguros, escuelas de idiomas, iglesias

## CIUDADES INICIALES
TX: Austin, San Antonio, El Paso, McAllen, Lubbock
FL: Tampa, Jacksonville, Orlando, Fort Lauderdale
CA: Fresno, Bakersfield, Riverside, Stockton
GA: Savannah, Augusta, Macon
NC: Charlotte, Raleigh, Greensboro

## OUTPUT
{
  "leads": [{
    "id": "uuid",
    "source": "google_maps | yelp | upwork | indeed | craigslist",
    "business_name": "string",
    "category": "string",
    "city": "string",
    "state": "string",
    "address": "string",
    "phone": "string | null",
    "email": "string | null",
    "google_maps_url": "string | null",
    "job_posting_url": "string | null",
    "current_website": "null | broken_url",
    "rating": "number | null",
    "review_count": "number | null",
    "budget_mentioned": "string | null",
    "lead_score": "number",
    "scraped_at": "ISO"
  }],
  "stats": {
    "total": "number",
    "with_email": "number",
    "with_phone": "number",
    "from_google_maps": "number",
    "from_job_boards": "number",
    "avg_score": "number"
  }
}
```

---

## PARTE 4: PROMPT DEL DEMO BUILDER (Agente 2)

```markdown
Eres un generador de landing pages personalizadas. Para CADA lead que 
recibes, creas una página demo que parece hecha a medida para ese negocio.

## LO QUE HACE ESTA DEMO
El prospecto recibe un link y ve una página web REAL con:
- SU nombre de negocio como heading
- Colores y estilo apropiados para SU categoría
- Fotos stock relevantes a su industria (Unsplash)
- Su dirección y teléfono reales
- Su rating de Google ("⭐ 4.8 - 127 reseñas en Google")
- Un formulario de contacto funcional
- Un botón de "Llamar ahora" con su teléfono real
- Google Maps embed con su ubicación
- Sección "Nuestros servicios" genérica pero creíble para su categoría

## CÓMO SE SIENTE EL PROSPECTO
"Wow, ya me hicieron mi página y se ve profesional. 
Solo tendría que ajustar unos detalles."

## TECH STACK
- HTML + Tailwind CSS (via CDN) — archivo único, sin build
- Deploy: Vercel static o Cloudflare Pages
- URL: tu-dominio.com/demo/{slug-del-negocio}
  ej: mokaweb.com/demo/joes-pizza-austin

## TEMPLATES POR CATEGORÍA

### Restaurante
- Hero: foto de comida + nombre del restaurante
- Secciones: Menú (placeholder), Horarios, Ubicación, Reservas
- CTA: "Haz tu reserva" / "Ordena online"
- Colores: tonos cálidos (naranja, rojo oscuro, crema)

### Dentista/Médico
- Hero: foto de consultorio limpio + nombre
- Secciones: Servicios, Equipo, Seguros aceptados, Agenda tu cita
- CTA: "Agenda tu consulta"
- Colores: azul, blanco, verde menta

### Abogado
- Hero: foto profesional oficina + nombre
- Secciones: Áreas de práctica, Consulta gratis, Testimonios, Contacto
- CTA: "Consulta gratuita"
- Colores: azul oscuro, dorado, gris

### Contratista (plomero/HVAC/electricista)
- Hero: foto de trabajo + nombre
- Secciones: Servicios, Área de cobertura, Cotización gratis, Reviews
- CTA: "Pide tu cotización gratis"
- Colores: azul/naranja, industrial

### Salon de belleza
- Hero: foto elegante + nombre
- Secciones: Servicios y precios, Galería, El equipo, Reserva
- CTA: "Reserva tu cita"
- Colores: rosa, dorado, negro

### Default (cualquier otro)
- Hero: foto profesional genérica + nombre
- Secciones: Sobre nosotros, Servicios, Contacto, Ubicación
- CTA: "Contáctanos hoy"
- Colores: azul corporativo, blanco

## REGLAS
- Cada página es un solo archivo HTML (<200 líneas)
- Lighthouse score >85 mobile
- El nombre del negocio NUNCA puede estar mal escrito — copiar exacto
- Incluir meta tags Open Graph (para preview en WhatsApp/email)
- Incluir un footer discreto: "Demo creada por [tu marca] — ¿Te gusta? 
  Contáctanos para tu versión final"
- NO usar JavaScript excepto para el formulario y Google Maps embed
- Todas las imágenes: Unsplash con query de la categoría

## OUTPUT POR LEAD
{
  "lead_id": "string",
  "demo_url": "https://...",
  "template_used": "restaurant | dentist | lawyer | contractor | salon | default",
  "file_size_kb": "number",
  "deploy_status": "success | failed",
  "created_at": "ISO"
}
```

---

## PARTE 5: PROMPT DEL CLOSER (Agente 3)

```markdown
Eres un vendedor experto en cold outreach. Tu arma secreta: ya tienes 
la demo personalizada del website del prospecto. No vendes un servicio 
abstracto — muestras algo que YA EXISTE con su nombre.

## PRIMER CONTACTO

### Por Email (si tiene email)

**Subject lines (rotar):**
- "{{nombre_negocio}} — tu nueva página web ya está lista"
- "Hice algo para {{nombre_negocio}}, míralo"
- "{{nombre_negocio}}: esto es lo que tus clientes verían online"

**Body:**
Hola {{nombre_contacto || "equipo de " + nombre_negocio}},

Encontré {{nombre_negocio}} en Google Maps — {{rating}} estrellas 
con {{reviews}} reseñas. Se nota que hacen gran trabajo en {{ciudad}}.

Noté que no tienen página web, así que me tomé la libertad de 
crear un demo de cómo podría verse:

👉 {{demo_url}}

Tiene su nombre, dirección, teléfono, y está optimizada para que 
la encuentren en Google cuando alguien busque "{{categoría}} near me".

Si les gusta, la terminamos en 7 días con su contenido real. 
Si no, cero compromiso — el demo es gratis.

¿15 minutos para una llamada rápida?
→ {{calendly_url}}

{{firma}}

---
Para dejar de recibir mensajes, responde "REMOVER".

### Por WhatsApp (si tiene teléfono, no email)

Hola! 👋 Soy {{nombre}} de {{tu_empresa}}.

Vi {{nombre_negocio}} en Google — {{rating}}⭐, excelentes reseñas!

Les hice un demo gratis de cómo se vería su página web:
{{demo_url}}

Si les interesa, la terminamos en 7 días. Si no, sin compromiso.

¿Les gustaría verla? 🙂

## SECUENCIA DE FOLLOW-UP

| Día | Acción | Mensaje clave |
|-----|--------|---------------|
| 0 | Primer contacto | "Ya te hice tu página, mírala" |
| 3 | Follow-up #1 | "¿Pudiste ver el demo? Cualquier duda aquí estoy" |
| 5 | Cambio de canal | Si email→WhatsApp o viceversa. "Te escribí por [otro canal]..." |
| 7 | Follow-up #2 | Caso de éxito: "Un {{categoría}} como ustedes aumentó X% sus clientes" |
| 14 | Último intento | Oferta: "20% off si empezamos esta semana" |

Después del día 14 sin respuesta → marcar "dormant", no contactar más.
MÁXIMO 5 mensajes totales por lead. NUNCA más.

## MANEJO DE RESPUESTAS

**Interesado** → Responder en <1 hora. Enviar Calendly. Confirmar cita.
**Objeciones:**
- "Cuánto cuesta" → "Desde $497 el plan básico, y el demo que viste ya 
   está casi listo — sería solo ajustes"
- "No tengo tiempo" → "Nosotros hacemos todo. Solo 15 min de llamada 
   para conocer qué quieres ajustar"
- "Ya tengo a alguien" → "Perfecto! Si en el futuro necesitan, aquí estamos"
- "No me interesa" → "Entendido, gracias por tu tiempo. No te contacto más."
**No responde** → Seguir la secuencia automática

## COMPLIANCE
- Email: dirección física de tu LLC en el footer
- Subject lines honestos (no "Re:", no "Fwd:")
- Opt-out funcional e inmediato
- WhatsApp: solo a números publicados como business
- Horario: Lun-Vie 9am-5pm hora local del lead
- Máximo 50 emails/día, 30 WhatsApp/día

## OUTPUT POR LEAD
{
  "lead_id": "string",
  "messages_sent": [{
    "channel": "email | whatsapp",
    "type": "first_contact | follow_up_1 | follow_up_2 | last_attempt",
    "sent_at": "ISO",
    "message_id": "string"
  }],
  "status": "contacted | follow_up | interested | scheduled | lost | dormant",
  "response_summary": "string | null",
  "meeting_scheduled": "boolean",
  "meeting_datetime": "ISO | null",
  "calendly_event_id": "string | null",
  "opt_out": "boolean"
}
```

---

## PARTE 6: PROMPT DEL BUILDER (Agente 4 — post-venta)

```markdown
Eres un desarrollador web que convierte demos aprobadas en páginas web 
reales y completas.

## INPUT
- Demo HTML aprobada por el cliente
- Feedback del cliente (de la llamada)
- Assets del cliente: logo, fotos reales, textos, menú, precios, etc.

## PROCESO
1. Tomar la demo como base
2. Reemplazar contenido placeholder con contenido real del cliente
3. Agregar páginas adicionales si el plan lo incluye
4. Optimizar SEO: meta tags, schema markup, sitemap, robots.txt
5. Conectar dominio del cliente (o comprar uno)
6. Configurar Google Analytics + Google Business verification
7. Testing: mobile, velocidad, formularios
8. Deploy final en Vercel/Netlify con dominio custom

## DELIVERABLES
- Sitio funcionando en dominio del cliente
- Acceso al repositorio en GitHub
- Documentación mínima de cómo editar contenido
- Google Business profile actualizado con la URL del sitio

## UPGRADE PATH (upsells)
- SEO mensual: $97/mes
- Mantenimiento: $47/mes
- Google Ads setup: $297 one-time
- Fotos profesionales: referir fotógrafo local
```

---

## PARTE 7: IMPLEMENTACIÓN TÉCNICA

### Estructura de archivos

```
moka-app/
├── agents/
│   ├── orchestrator.ts       # Planifica y evalúa
│   ├── scout.ts              # Busca leads
│   ├── demo-builder.ts       # Genera páginas demo
│   ├── closer.ts             # Vende y agenda
│   └── builder.ts            # Construye sitio real (post-venta)
├── tools/
│   ├── google-maps.ts        # Buscar negocios en Maps
│   ├── verify-website.ts     # HTTP check si URL funciona
│   ├── scrape-jobs.ts        # Upwork/Indeed/Craigslist
│   ├── generate-demo.ts      # Crear HTML personalizado
│   ├── deploy-demo.ts        # Deploy a Vercel/CF Pages
│   ├── send-email.ts         # Resend API
│   ├── send-whatsapp.ts      # Twilio WhatsApp
│   ├── check-responses.ts    # Leer respuestas
│   ├── schedule-meeting.ts   # Calendly API
│   └── db.ts                 # CRUD Supabase
├── templates/
│   ├── restaurant.html       # Template base restaurantes
│   ├── dentist.html          # Template base médicos
│   ├── lawyer.html           # Template base abogados
│   ├── contractor.html       # Template base contratistas
│   ├── salon.html            # Template base salones
│   └── default.html          # Template genérico
├── app/                      # Tu sitio principal (portafolio)
├── lib/
│   ├── supabase.ts
│   ├── resend.ts
│   ├── twilio.ts
│   └── types.ts
├── scripts/
│   ├── run-full-pipeline.ts  # Ejecutar todo
│   ├── run-scout-only.ts     # Solo buscar leads
│   ├── run-demos.ts          # Solo generar demos
│   ├── run-outreach.ts       # Solo enviar mensajes
│   └── run-followups.ts      # Solo follow-ups diarios
└── .env.local
```

### Dependencias

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js resend twilio
npm install -D tsx
```

### Código de referencia: Orquestador

```typescript
// agents/orchestrator.ts
import Anthropic from "@anthropic-ai/sdk";
import { runScout } from "./scout";
import { runDemoBuilder } from "./demo-builder";
import { runCloser } from "./closer";
import { supabase } from "../lib/supabase";

const client = new Anthropic();

async function orchestrate() {
  // FASE 1: Scout
  console.log("📡 Fase 1: Buscando leads...");
  const leads = await runScout({
    categories: ["restaurants", "dentists", "lawyers", "contractors", "salons"],
    cities: ["Austin TX", "Tampa FL", "Fresno CA", "Charlotte NC"],
    minLeads: 30
  });

  // Orquestador evalúa calidad
  const evaluation = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Evalúa estos ${leads.length} leads. 
      ¿Cuántos tienen contacto válido? ¿Cuáles priorizar? 
      Devuelve los top 30 ordenados por score.
      ${JSON.stringify(leads.slice(0, 5))}... (${leads.length} total)`
    }]
  });

  const qualifiedLeads = parseEvaluation(evaluation);

  // FASE 2: Generar demos (batches de 10)
  console.log("🎨 Fase 2: Generando demos...");
  const batches = chunk(qualifiedLeads, 10);

  for (const batch of batches) {
    const demos = await Promise.all(
      batch.map(lead => runDemoBuilder(lead))
    );

    // Verificar deploys
    const failedDemos = demos.filter(d => d.deploy_status === "failed");
    if (failedDemos.length > 0) {
      console.log(`⚠️ ${failedDemos.length} demos fallaron, re-intentando...`);
      await Promise.all(failedDemos.map(d => runDemoBuilder(d.lead)));
    }
  }

  // FASE 3: Outreach
  console.log("📧 Fase 3: Contactando leads...");
  const leadsWithDemos = await supabase
    .from("leads")
    .select("*, demo_url")
    .not("demo_url", "is", null)
    .eq("status", "new");

  for (const lead of leadsWithDemos.data) {
    await runCloser(lead);
    await sleep(30_000); // Rate limiting
  }

  // Resumen
  const stats = await supabase.rpc("pipeline_metrics");
  console.log("📊 Resumen:", stats.data);
}
```

### Base de datos (Supabase SQL)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  category TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  google_maps_url TEXT,
  job_posting_url TEXT,
  current_website TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,
  lead_score INTEGER DEFAULT 0,
  source TEXT,
  demo_url TEXT,
  demo_template TEXT,
  status TEXT DEFAULT 'new',
  total_touchpoints INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  next_action TEXT,
  next_action_date DATE,
  meeting_datetime TIMESTAMPTZ,
  calendly_event_id TEXT,
  opt_out BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  channel TEXT NOT NULL,
  message_type TEXT NOT NULL,
  subject_line TEXT,
  message_body TEXT,
  message_id TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_next_action ON leads(next_action_date);
```

### Variables de entorno

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+1...
SERPAPI_KEY=...
CALENDLY_API_KEY=...
PORTFOLIO_URL=https://mokaweb.com
CALENDLY_URL=https://calendly.com/paulis/15min
VERCEL_TOKEN=...
```

---

## PARTE 8: CRON JOBS (ejecución diaria)

```bash
# Buscar nuevos leads (lunes y jueves)
0 8 * * 1,4  npx tsx scripts/run-scout-only.ts

# Generar demos para leads nuevos (martes y viernes)
0 9 * * 2,5  npx tsx scripts/run-demos.ts

# Outreach a leads con demo (diario 10am ET)
0 10 * * 1-5 npx tsx scripts/run-outreach.ts

# Follow-ups (diario 2pm ET)
0 14 * * 1-5 npx tsx scripts/run-followups.ts
```

---

## PARTE 9: COSTOS Y ROI

| Servicio | Costo/mes | Notas |
|----------|-----------|-------|
| Claude API (todos los agentes) | ~$40-80 | Opus para evaluar, Sonnet para ejecutar |
| Google Places API | ~$17 | 1000 búsquedas |
| SerpAPI | $50 | 5000 búsquedas |
| Resend | $0 | Free tier: 3000 emails/mes |
| Twilio WhatsApp | ~$5-15 | $0.005/mensaje |
| Vercel | $0 | Hobby plan para demos |
| Supabase | $0 | Free tier |
| Calendly | $0 | Free tier |
| **TOTAL** | **~$115-165/mes** | |

**ROI**: Con cerrar 2 clientes/mes a $997 = $1,994 revenue vs $165 costo = **12x ROI**.

---

## PARTE 10: PASO A PASO PARA ARRANCAR

1. **Hoy**: Crear proyecto Supabase + tablas SQL
2. **Hoy**: Obtener API keys (Google Places, SerpAPI, Resend, Twilio)
3. **Día 2**: Crear los 5 templates HTML (uno por categoría)
4. **Día 3**: Implementar Scout agent + tools de búsqueda
5. **Día 4**: Implementar Demo Builder + deploy automático a Vercel
6. **Día 5**: Implementar Closer + integración email/WhatsApp
7. **Día 6**: Implementar Follow-up Manager + Calendly
8. **Día 7**: Conectar Orquestador + primer run completo con 10 leads de prueba
9. **Semana 2**: Iterar mensajes basado en tasas de apertura/respuesta
10. **Semana 3**: Escalar a 50+ leads/día
