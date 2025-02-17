import supabase from "@/lib/supabaseAdmin";

export interface PlanLimit {
  name: string
  request_limit: number | null
  reset_period: 'day' | 'week' | 'month' | 'year'
  stripe_price_id: string | null
}

export interface PlanLimits {
  FREE: PlanLimit
  BASIC: PlanLimit
  PRO: PlanLimit
}

export async function fetchPlanLimits(): Promise<PlanLimits> {
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
  
  if (error) {
    console.error('Error fetching plan limits:', error)
    throw error
  }

  // Transform the data into the required format
  const planLimits: Partial<PlanLimits> = {}
  
  data.forEach((limit) => {
    const planName = limit.name.split('_')[0] as keyof PlanLimits // Type assertion
    if (!planLimits[planName]) {
      planLimits[planName] = {
        name: planName,
        request_limit: limit.request_limit,
        reset_period: limit.reset_period,
        stripe_price_id: limit.stripe_price_id
      }
    }
  })

  return planLimits as PlanLimits
} 