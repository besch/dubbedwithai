import supabase from "@/lib/supabaseClient";

export async function checkUsageLimit(ip_address: string) {
  // Get FREE plan limit first
  const { data: freePlan } = await supabase
    .from('plan_limits')
    .select('request_limit, reset_period')
    .eq('name', 'FREE')
    .single();

  const freeLimit = freePlan?.request_limit || 5;

  // Get current usage
  let { data: usage } = await supabase
    .from('audio_generation_usage')
    .select('count, reset_at')
    .eq('ip_address', ip_address)
    .single();

  console.log('Current usage before increment:', { usage });

  // Check if we need to reset the count
  if (usage && new Date(usage.reset_at) <= new Date()) {
    console.log('Resetting count due to period expiration');
    const resetAt = getNextResetDate(freePlan?.reset_period || 'week');
    const { data: resetUsage, error: resetError } = await supabase
      .from('audio_generation_usage')
      .update({ 
        count: 1, // Start with 1 for this new request
        reset_at: resetAt,
        updated_at: new Date().toISOString()
      })
      .eq('ip_address', ip_address)
      .select()
      .single();
    
    if (resetError) {
      console.error('Error resetting count:', resetError);
      return { hasExceededLimit: false, currentCount: 0, resetAt };
    }
    
    usage = resetUsage;
  } else if (usage) {
    // Update existing record
    const newCount = usage.count + 1;
    const { data: updatedUsage, error: updateError } = await supabase
      .from('audio_generation_usage')
      .update({ 
        count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('ip_address', ip_address)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating count:', updateError);
      return { hasExceededLimit: true, currentCount: usage.count, resetAt: usage.reset_at };
    }
    
    usage = updatedUsage;
  } else {
    // Insert new record
    const resetAt = getNextResetDate(freePlan?.reset_period || 'week');
    const { data: newUsage, error: insertError } = await supabase
      .from('audio_generation_usage')
      .insert({
        ip_address,
        count: 1,
        reset_at: resetAt
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting usage:', insertError);
      return { hasExceededLimit: false, currentCount: 0, resetAt };
    }

    usage = newUsage;
  }

  const currentCount = usage?.count || 0;
  return {
    currentCount,
    hasExceededLimit: currentCount >= freeLimit,
    resetAt: usage?.reset_at,
  };
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
