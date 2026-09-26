import { PublicProperty, PropertySearchIntent } from './types';
import { normalizeSearchText } from './text-normalizer';

export interface RankedPublicProperty {
  property: PublicProperty;
  preferenceMatches: string[];
  preferenceMisses: string[];
  rankingPoints: number;
}

export function rankPublicProperties(
  properties: PublicProperty[],
  intent: PropertySearchIntent
): RankedPublicProperty[] {
  if (!properties || properties.length === 0) {
    return [];
  }

  const preferredFeatures = intent.preferredFeatures || [];
  const normalizedPreferred = preferredFeatures
    .map(f => normalizeSearchText(f))
    .filter(Boolean);

  // If no preferred features, return stable wrapped items with 0 points
  if (normalizedPreferred.length === 0) {
    return properties.map((property, index) => ({
      property,
      preferenceMatches: [],
      preferenceMisses: [],
      rankingPoints: 0,
      __originalIndex: index,
    })) as any;
  }

  const rankedItems = properties.map((property, index) => {
    const propFeatures = Array.isArray(property.features) ? property.features : [];
    const normalizedPropFeatures = propFeatures.map(f => normalizeSearchText(f));

    const matches: string[] = [];
    const misses: string[] = [];

    for (let i = 0; i < preferredFeatures.length; i++) {
      const originalFeat = preferredFeatures[i];
      const normFeat = normalizedPreferred[i];

      // Safe matching: exact match or safe substring for terms >= 4 chars to prevent false positives like 'mar' in 'armario'
      const hasMatch = normalizedPropFeatures.some(pf => {
        if (!pf || !normFeat) return false;
        return pf === normFeat || (normFeat.length >= 4 && pf.includes(normFeat));
      });

      if (hasMatch) {
        matches.push(originalFeat);
      } else {
        misses.push(originalFeat);
      }
    }

    const rankingPoints = matches.length;

    return {
      property,
      preferenceMatches: matches,
      preferenceMisses: misses,
      rankingPoints,
      __originalIndex: index,
    };
  });

  // Stable sort: higher points first, tie-breaker: original index
  rankedItems.sort((a, b) => {
    if (b.rankingPoints !== a.rankingPoints) {
      return b.rankingPoints - a.rankingPoints;
    }
    return a.__originalIndex - b.__originalIndex;
  });

  return rankedItems.map(({ __originalIndex, ...rest }) => rest);
}
