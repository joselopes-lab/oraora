export function getLeadOrigin(campaignData: any): string {
    if (!campaignData) return 'Orgânico';
    
    const source = (campaignData.utm_source || '').toLowerCase();
    const gclid = !!campaignData.gclid;
    const fbclid = !!campaignData.fbclid;

    if (gclid || source.includes('google')) return 'Google Ads';
    if (fbclid || source.includes('facebook') || source.includes('instagram') || source.includes('meta')) return 'Meta Ads';
    return 'Outros';
}
