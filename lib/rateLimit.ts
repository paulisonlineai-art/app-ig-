import { createServerSupabase } from '@/lib/supabase'

export type Plan = 'free' | 'starter' | 'pro' | 'agency'

const MIN_INTERVAL_SECONDS: Record<string, number> = {
  sync: 60,
  refresh_profile: 60,
  competitor_sync: 60,
  brand_auto_generate: 30,
  transcribe: 20,
  adapt: 3,
  chat: 5,
  generate_ideas: 15,
}

// Daily limits per plan. Each action maps to max uses per day.
const PLAN_LIMITS: Record<Plan, Record<string, number>> = {
  free: {
    sync: 1,
    refresh_profile: 1,
    competitor_sync: 1,
    chat: 5,
    generate_ideas: 3,
    brand_auto_generate: 1,
    transcribe: 2,
    adapt: 5,
    hook_lab: 3,
    predict_virality: 3,
    comment_ideas: 2,
  },
  starter: {
    sync: 2,
    refresh_profile: 2,
    competitor_sync: 3,
    chat: 20,
    generate_ideas: 10,
    brand_auto_generate: 3,
    transcribe: 10,
    adapt: 15,
    hook_lab: 10,
    predict_virality: 10,
    comment_ideas: 10,
  },
  pro: {
    sync: 5,
    refresh_profile: 5,
    competitor_sync: 10,
    chat: 50,
    generate_ideas: 30,
    brand_auto_generate: 10,
    transcribe: 30,
    adapt: 50,
    hook_lab: 30,
    predict_virality: 30,
    comment_ideas: 30,
  },
  agency: {
    sync: 10,
    refresh_profile: 10,
    competitor_sync: 20,
    chat: 200,
    generate_ideas: 100,
    brand_auto_generate: 20,
    transcribe: 100,
    adapt: 200,
    hook_lab: 100,
    predict_virality: 100,
    comment_ideas: 100,
  },
}

let planCache: Record<string, { plan: Plan; ts: number }> = {}

async function getAccountPlan(db: any, accountId: string): Promise<Plan> {
  const cached = planCache[accountId]
  if (cached && Date.now() - cached.ts < 60_000) return cached.plan

  const { data } = await db.from('ig_accounts').select('plan').eq('id', accountId).single()
  const plan = (data?.plan || 'free') as Plan
  planCache[accountId] = { plan, ts: Date.now() }
  return plan
}

export async function checkRateLimit(accountId: string, action: string): Promise<
  { ok: true } | { ok: false; retryAfterSeconds: number; message?: string }
> {
  const db = createServerSupabase()
  const minInterval = MIN_INTERVAL_SECONDS[action] ?? 10

  const { data } = await db.from('rate_limits')
    .select('last_called_at, daily_count, daily_reset_at')
    .eq('account_id', accountId).eq('action', action).maybeSingle()
  const now = Date.now()

  // Cooldown check
  if (data?.last_called_at) {
    const elapsed = (now - new Date(data.last_called_at).getTime()) / 1000
    if (elapsed < minInterval) {
      return { ok: false, retryAfterSeconds: Math.ceil(minInterval - elapsed) }
    }
  }

  // Daily limit check (plan-based)
  const plan = await getAccountPlan(db, accountId)
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const maxDaily = limits[action]

  if (maxDaily) {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const resetAt = data?.daily_reset_at ? new Date(data.daily_reset_at).getTime() : 0
    const needsReset = resetAt < todayStart.getTime()
    const currentCount = needsReset ? 0 : (data?.daily_count || 0)

    if (currentCount >= maxDaily) {
      const tomorrow = new Date(todayStart)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      const secsUntilReset = Math.ceil((tomorrow.getTime() - now) / 1000)
      const planLabel = plan === 'free' ? 'gratuito' : plan
      return {
        ok: false,
        retryAfterSeconds: secsUntilReset,
        message: `Llegaste al límite diario de ${maxDaily} usos (plan ${planLabel}). Se resetea a medianoche UTC.`,
      }
    }

    await db.from('rate_limits').upsert(
      {
        account_id: accountId,
        action,
        last_called_at: new Date(now).toISOString(),
        daily_count: currentCount + 1,
        daily_reset_at: todayStart.toISOString(),
      },
      { onConflict: 'account_id,action' }
    )
    return { ok: true }
  }

  await db.from('rate_limits').upsert(
    { account_id: accountId, action, last_called_at: new Date(now).toISOString() },
    { onConflict: 'account_id,action' }
  )
  return { ok: true }
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}
