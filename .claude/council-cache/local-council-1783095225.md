# Local Council — Sistema de memoria de Moka

**Local council** — estas perspectivas vienen todas de Claude jugando distintos roles, no de distintos proveedores de IA. Tratar la coincidencia entre ellas como un punto de partida compartido para poner a prueba, no como confirmación independiente.

**Pregunta:** ¿Qué enfoque recomiendan para estructurar el sistema de memoria del proyecto Moka (analytics de Instagram)?

**Contexto dado:** App Next.js en `moka-app` con Supabase (`lib/supabase.ts`), integración con Instagram API (`lib/instagram.ts`) y módulo de IA (`lib/ai.ts`, 207 líneas).

---

## 🗳️ Devil's Advocate

### Position
No hace falta "diseñar un sistema de memoria": ya existe uno, en `supabase-schema.sql`, y funciona como tabla relacional persistente — el verdadero riesgo es que alguien lo confunda con un problema de IA/embeddings y termine construyendo infraestructura que esta app no necesita.

### Key points
- `chatWithMoka` en `lib/ai.ts` no tiene memoria conversacional real: es stateless. Cada llamada reconstruye el contexto desde cero (últimos 30 reels + stats) y no persiste historial de preguntas/respuestas.
- El corte a los últimos 20 reels por `views` descendente es una decisión de memoria disfrazada de detalle de implementación — arbitraria y sin justificar.
- `ai_analysis` existe como columna en `reels`, pero nada en el código leído garantiza que se persista antes de descartarse: si se regenera en cada visita, se paga la API de Anthropic repetidamente por el mismo reel.
- `access_token` se guarda en texto plano en `ig_accounts` — antes de ampliar qué se recuerda, hay que resolver qué tan seguro es lo que ya se recuerda.
- Nadie truncó por tokens, solo por cantidad de reels — con cuentas grandes o captions largos esto puede reventar el límite de contexto silenciosamente.

### Risks & blind spots
La pregunta asume que hace falta una decisión de arquitectura nueva; el riesgo real es sobre-ingeniería (vector store, embeddings, framework tipo LangChain) para un caso que hoy se resuelve con un `SELECT` bien filtrado. Otros roles probablemente van a discutir *dónde* guardar memoria sin cuestionar *si* conviene que el usuario sienta que Moka "recuerda" — eso tiene implicancias de producto y de costo. Tampoco se va a mencionar que memoria conversacional persistente introduce un problema nuevo de privacidad/RLS.

### Confidence
`medium` — análisis del código concreto y verificable, pero no se confirmó RLS en Supabase ni se leyó `analyze-reel/route.ts`.

---

## 🗳️ Simplicity Champion

### Position
No construyan un "sistema de memoria": lo que ya tienen (Postgres vía Supabase) es la memoria, y lo único que falta es pasarle a `chatWithMoka` el historial de mensajes previos como texto plano en el prompt — nada más.

### Key points
- `lib/ai.ts` ya reconstruye "memoria" de contenido/negocio en cada llamada leyendo `reels`, `brand_dna` y stats desde Supabase — no hay que rearquitecturarlo, hay que reusarlo.
- Para "recordar la conversación": una tabla `chat_messages` (id, account_id, role, content, created_at) + `select ... limit 20` interpolado en el prompt resuelve el 90% del caso sin vector DB ni librerías de "agent memory".
- El schema ya tiene 9 tablas con patrones claros; agregar `conversations`/`chat_messages` sigue el mismo patrón, es la opción de menor sorpresa.
- Cachear datos de Instagram tampoco necesita Redis: `synced_at` y `last_synced_at` ya existen en el schema — falta usarlos consistentemente.
- `chatWithMoka` ya trunca a los últimos 20 reels: ese es el patrón correcto (ventana acotada). Aplicar el mismo criterio al historial de chat evita la tentación de sumar un vector store que esta app no necesita.

### Risks & blind spots
El riesgo de sobre-ingeniería es meter una librería de "agent memory" o vector store (pgvector, Pinecone) para lo que es, en esencia, una tabla de mensajes con paginación — con probablemente 1-10 cuentas gestionadas, el volumen no lo justifica. Otro riesgo: crear una abstracción tipo `MemoryManager`/`ContextBuilder` cuando el archivo de 207 líneas ya es legible construyendo su propio contexto explícitamente. La pregunta misma asume que hace falta un sistema nuevo cuando la estructura ya existe.

### Confidence
`high` — código simple, campos relevantes ya visibles y verificables.

---

## 🗳️ Security Auditor

### Position
No construyan ningún sistema de memoria (cache de IG, contexto de IA o historial de analytics) hasta blindar el control de acceso actual: hoy el `account_id` que decide qué datos ve la IA viene de una cookie sin firmar y no hay RLS en Supabase, así que cualquier capa de memoria nueva heredaría el mismo agujero de IDOR.

### Key points
- **IDOR en el gate de autenticación**: en `app/api/ai/chat/route.ts`, `accountId` sale de la cookie `ig_account_id` sin firma ni verificación de sesión. Un atacante puede fijar esa cookie a cualquier UUID y ver reels, métricas y ADN de marca de otra cuenta.
- **Tokens de Instagram en texto plano** en `ig_accounts.access_token` — un volcado de tabla o RLS mal configurada expone tokens de 60 días de todos los usuarios.
- **Sin RLS visible** en `supabase-schema.sql`, y hay un cliente anon (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) usado en cliente además del `service_role` en servidor — sin RLS, cualquier fila (incluida la futura tabla de memoria) es potencialmente legible.
- **Prompt injection vía "memoria" de contenido**: `lib/ai.ts` interpola directamente transcripts, captions e insights de competidores sin sanitizar. Si se cachean transcripciones scrapeadas de competidores, un competidor podría insertar instrucciones maliciosas que se cuelen en respuestas futuras.
- Si se agrega una tabla de conversaciones, cada fila debe llevar `account_id` con FK y depender de sesión verificada (JWT firmado), no de la cookie plana actual — de lo contrario la memoria persistente empeora el IDOR existente.

### Risks & blind spots
Otros lentes probablemente van a evaluar la memoria como "dónde vive el estado" (Redis vs. Supabase vs. embeddings) sin notar que el control de acceso ya está roto antes de agregar memoria. Tampoco se está considerando qué pasa si `token_expires_at` vence y el refresh falla silenciosamente, exponiendo un token stale reutilizado.

### Confidence
`high` — hallazgos confirmados leyendo el código real (cookie sin firmar, ausencia de RLS, token en texto plano, interpolación directa en prompts).

---

## 🗳️ Scalability Architect

### Position
No construyan "sistema de memoria" todavía: los cuellos de botella reales de escala están en la sincronización con la API de Instagram y en cómo crece `chatWithMoka`, no en agregar una capa de memoria conversacional prematura.

### Key points
- `chatWithMoka` mete `reels.slice(0, 20)` completos como JSON en cada prompt — a 10x cuentas o reels, ese payload crece linealmente y el costo/latencia de Claude escalan sin que nadie lo note hasta la factura.
- No hay historial de conversación persistido. Si se agrega, la estrategia que escala es resumen rodante (rolling summary) + últimos k mensajes crudos, actualizado async — no guardar todo el historial crudo y reinyectarlo (eso escala O(n) tokens por turno).
- `lib/instagram.ts` no tiene cache/rate-limit visible — con 100x reels o cuentas, esto es un cuello de botella real de rate limits de Meta antes que cualquier problema de "memoria de IA". La prioridad de caching debería ser Instagram API antes que contexto de IA.
- `brand_dna` y `accountAverages` sí son candidatos legítimos de memoria de largo plazo reutilizable — convendría computarlos como materialized view o job periódico en vez de recalcularlos on-demand.
- Todo corre síncrono en el request/response de Next.js, sin colas ni jobs — si "memoria" incluye acumular análisis históricos de IA, eso debería moverse a un worker asíncrono antes de que el volumen lo haga inviable en el path de request.

### Risks & blind spots
El riesgo mayor es que "agregar memoria" en la capa equivocada (más contexto en el prompt) empeore el problema real, que es de costo y latencia por request, no de falta de contexto. Tampoco se verificó si el límite de reels se aplica en SQL (`LIMIT`) o se trae todo y se recorta en JS — eso importa mucho a 100x volumen. Punto ciego sobre multi-tenencia: el schema es single-tenant-friendly por `account_id`, pero no se confirmó aislamiento a nivel de query.

### Confidence
`medium` — confirma la ausencia de memoria/cache real, pero no revisó todos los `app/api` routes; las proyecciones a 10x/100x son extrapolación razonada.

---

## Síntesis — ángulos, no consenso

### Puntos de partida compartidos
Los cuatro miembros coinciden en algo notable: **hoy no existe ningún "sistema de memoria"** — `chatWithMoka` es completamente stateless, reconstruye contexto desde cero en cada llamada, y no hay tabla de historial de chat ni cache real de nada. Como esto es Claude respondiendo cuatro veces con el mismo modelo, esta coincidencia es un prior compartido a poner a prueba, no una confirmación independiente — vale la pena verificar directamente en el código si esa lectura es correcta antes de asumirla como hecho.

### Tensiones genuinas
- **Simplicity vs. Security/Scalability sobre "qué construir primero"**: Simplicity dice "agreguen una tabla `chat_messages` y listo"; Security dice "no agreguen nada de memoria hasta arreglar el IDOR de la cookie sin firmar"; Scalability dice "el cuello de botella real está en Instagram API, no en memoria de IA". Para este proyecto, la tensión que más importa es Security vs. Simplicity: agregar memoria persistente sobre un control de acceso roto (cookie sin firmar, sin RLS) multiplica lo que hay para robar en una sola consulta. Esto sugiere que el orden correcto es: primero cerrar el IDOR, después la tabla simple de mensajes.
- **Devil's Advocate vs. Simplicity sobre el corte de reels**: ambos ven el mismo problema (truncamiento arbitrario a 20 reels por views) pero Devil's Advocate lo lee como un bug latente de calidad de respuesta, mientras Simplicity lo valida como "el patrón correcto" de ventana acotada. La diferencia real es si el criterio de selección (por views) es el correcto para todas las preguntas posibles del usuario — eso no se resolvió en ningún member.

### Puntos ciegos
- **Ninguno de los cuatro miembros propuso una respuesta cerrada sobre qué tipo de "memoria" pidió realmente el usuario** (¿historial de chat con Moka? ¿cache de datos de Instagram? ¿historial de analytics?) — los cuatro asumieron y respondieron sobre todo el espacio a la vez. Vale la pena confirmar la intención original antes de implementar.
- **Nadie verificó si RLS está configurado desde el dashboard de Supabase** (fuera del `schema.sql`) — tanto Security como Devil's Advocate señalan esto como ausente pero no confirmado con certeza.
- **La combinación IDOR + token en texto plano + prompt injection (todos señalados por Security) es el hallazgo con mayor impacto real** y ningún otro rol lo hubiera encontrado — Simplicity y Scalability estaban enfocados en estructura de datos y costo, no en quién puede leerlos.

### Dirección sugerida
1. **Primero, cerrar el IDOR**: reemplazar la cookie `ig_account_id` sin firmar por una sesión verificada (Supabase Auth / JWT firmado) antes de agregar cualquier tabla nueva de memoria — con soporte de Security Auditor y Devil's Advocate.
2. **Confirmar/activar RLS en Supabase** con policies por `account_id`, y evaluar cifrar `access_token` (o moverlo a un vault) — con soporte de Security Auditor.
3. **Recién después, agregar memoria como una tabla simple** `chat_messages` (account_id, role, content, created_at) con los últimos N mensajes interpolados en el prompt — con soporte unánime de Simplicity y Devil's Advocate, sin vector store ni embeddings.
4. **Para escalar**, priorizar cache de la API de Instagram (usando `synced_at`/`last_synced_at`, ya existentes en el schema) antes que optimizar el contexto de IA, y mover el análisis de IA (`ai_analysis`) a un job async si el volumen de reels crece — con soporte de Scalability Architect.

La incertidumbre real que queda: no está confirmado si RLS ya existe fuera del schema.sql leído, y no se confirmó qué significaba "memoria" en la pregunta original del usuario — ambas cosas conviene verificarlas antes de escribir código.
