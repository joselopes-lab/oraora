'use client';

export function getStoredCampaignData(): Record<string, string> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const data = sessionStorage.getItem('oraora_campaign_data');
    return data ? JSON.parse(data) : undefined;
  } catch {
    return undefined;
  }
}
