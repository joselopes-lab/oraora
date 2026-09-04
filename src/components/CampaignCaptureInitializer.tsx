'use client';

import { useCampaignCapture } from '@/hooks/useCampaignCapture';

export default function CampaignCaptureInitializer() {
  useCampaignCapture();
  return null;
}
