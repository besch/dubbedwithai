import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabaseClient';

function getNextResetDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() + (7 - now.getDay())));
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    case 'year':
      return new Date(now.getFullYear() + 1, 0, 1);
    default:
      return now;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Get user if authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get subscription if user is authenticated
  let planType = 'FREE';
  let planPeriod = 'WEEKLY';
  
  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, plan_period')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
      
    if (subscription) {
      planType = subscription.plan_type;
      planPeriod = subscription.plan_period;
    }
  }

  // Get plan limits
  const { data: planLimit } = await supabase
    .from('plan_limits')
    .select('request_limit, reset_period')
    .eq('name', `${planType}_${planPeriod}`)
    .single();

  // Get current usage
  const { data: usage } = await supabase
    .from('audio_generation_usage')
    .select('count, reset_at')
    .eq('ip_address', ip)
    .single();

  const count = usage?.count || 0;
  const resetAt = usage?.reset_at || getNextResetDate(planLimit?.reset_period || 'week');

  return res.status(200).json({
    plan: planType,
    period: planPeriod,
    limit: planLimit?.request_limit,
    used: count,
    remaining: planLimit?.request_limit ? planLimit.request_limit - count : null,
    nextReset: resetAt,
    isUnlimited: !planLimit?.request_limit
  });
} 