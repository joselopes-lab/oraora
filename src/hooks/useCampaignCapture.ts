'use client';

import { useEffect } from 'react';

const CAMPAIGN_STORAGE_KEY = 'oraora_campaign_data';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

export function useCampaignCapture() {
  useEffect(() => {
    // Verificar se já existe uma origem registrada (First-touch attribution)
    const existingData = sessionStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (existingData) return;

    const urlParams = new URLSearchParams(window.location.search);
    const campaignData: Record<string, string> = {};
    let hasParams = false;

    PARAMS.forEach((param) => {
      const value = urlParams.get(param);
      if (value) {
        campaignData[param] = value;
        hasParams = true;
      }
    });

    if (hasParams) {
      sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaignData));
    }
  }, []);
}
