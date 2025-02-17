import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabaseClient';

// Add type for subscription plans
export type SubscriptionPlan = 
  | 'FREE'
  | 'BASIC_MONTHLY'
  | 'PRO_MONTHLY'
  | 'BASIC_YEARLY'
  | 'PRO_YEARLY';

export async function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get subscription if user is authenticated
    let subscription = null;
    if (user) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_type, plan_period, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      subscription = sub;
    }

    // Get plan limits
    const planType = subscription?.plan_type || 'FREE';
    const planPeriod = subscription?.plan_period || 'WEEKLY';
    
    console.log('Looking up plan:', { planType, planPeriod });
    
    let { data: planLimit } = await supabase
      .from('plan_limits')
      .select('request_limit, reset_period')
      .eq('name', planType)
      .single();

    if (!planLimit) {
      console.error('Plan not found, falling back to FREE');
      const { data: freePlan } = await supabase
        .from('plan_limits')
        .select('request_limit, reset_period')
        .eq('name', 'FREE')
        .single();
        
      if (!freePlan) {
        throw new Error('No plan limits configured');
      }
      planLimit = freePlan;
    }

    // Get usage count
    const { data: usageCount } = await supabase
      .from('audio_generation_usage')
      .select('count, reset_at')
      .eq('ip_address', ip)
      .single();

    const count = usageCount?.count || 0;
    
    // Check if user has exceeded limit
    if (planLimit.request_limit && count >= planLimit.request_limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        plan: planType,
        resetTime: usageCount?.reset_at || getNextResetDate(planLimit.reset_period),
        currentUsage: count,
        limit: planLimit.request_limit
      });
    }

    // Update usage count
    if (usageCount) {
      await supabase
        .from('audio_generation_usage')
        .update({ 
          count: count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ip);
    } else {
      await supabase
        .from('audio_generation_usage')
        .insert({
          ip_address: ip,
          count: 1,
          reset_at: getNextResetDate(planLimit.reset_period)
        });
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    return res.status(500).json({ 
      error: 'Error checking rate limit',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getNextResetDate(period: string): string {
  const now = new Date();
  let resetDate = new Date();
  
  switch (period.toLowerCase()) {
    case 'week':
      resetDate.setDate(now.getDate() + (7 - now.getDay()));
      break;
    case 'month':
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'year':
      resetDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
  }
  
  return resetDate.toISOString();
} 