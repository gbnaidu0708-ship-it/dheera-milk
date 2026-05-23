import type { SupabaseClient } from '@supabase/supabase-js'

export type UserEventType =
  | 'signup'
  | 'login'
  | 'subscription_created'
  | 'subscription_modified'
  | 'subscription_cancelled'
  | 'subscription_paused'
  | 'subscription_resumed'
  | 'delivery_paused'
  | 'delivery_unpaused'
  | 'payment_recorded'
  | 'invoice_generated'
  | 'profile_updated'

/**
 * Append a row to `user_events`. Best-effort: never throws from caller's
 * perspective so audit logging can't break the primary request.
 */
export async function recordEvent(
  sb: SupabaseClient,
  userId: string,
  eventType: UserEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await sb.from('user_events').insert({
      user_id:    userId,
      event_type: eventType,
      metadata,
    })
  } catch {
    // swallow — audit failures must not surface to the user
  }
}
