/**
 * @fileOverview ORAORA POI SERVICE 1.0
 * Serviço server-side para consulta, normalização e cálculo de distância de Pontos de Interesse (POIs)
 * utilizando a Overpass API (OpenStreetMap).
 */

export interface PointOfInterest {
  id: string;
  name: string;
  category:
    | 'restaurant'
    | 'supermarket'
    | 'pharmacy'
    | 'health'
    | 'education'
    | 'gym'
    | 'leisure'
    | 'beach'
    | 'shopping'
    | 'services'
    | 'mobility';
  latitude: number;
  longitude: number;
  address?: string;
  distanceMeters: number;
  source: string;
  updatedAt: string;
  reliability: 'high' | 'medium' | 'low';
}

export const DEFAULT_RADIUS_METERS = 1500;
export const MAX_POIS_PER_CATEGORY = 5;
const OVERPASS_TIMEOUT_MS = 8000;

// Cache simples em memória server-side (TTL básico)
interface CacheEntry {
  timestamp: number;
  pois: PointOfInterest[];
}

const memoryPoiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

/**
 * Calcula a distância em metros entre duas coordenadas geográficas usando a fórmula de Haversine.
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Mapeia tags do OpenStreetMap para as categorias normalizadas do OraOra.
 */
function mapOsmTagToCategory(tags: Record<string, string>): PointOfInterest['category'] | null {
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') {
    return 'restaurant';
  }
  if (tags.shop === 'supermarket' || tags.shop === 'convenience' || tags.shop === 'grocery') {
    return 'supermarket';
  }
  if (tags.amenity === 'pharmacy') {
    return 'pharmacy';
  }
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'doctors') {
    return 'health';
  }
  if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'kindergarten') {
    return 'education';
  }
  if (tags.leisure === 'fitness_centre' || tags.sport === 'fitness') {
    return 'gym';
  }
  if (tags.leisure === 'park' || tags.tourism === 'attraction') {
    return 'leisure';
  }
  if (tags.natural === 'beach') {
    return 'beach';
  }
  if (tags.shop === 'mall' || tags.shop === 'department_store') {
    return 'shopping';
  }
  if (tags.public_transport === 'station' || tags.amenity === 'bus_station' || tags.railway === 'station') {
    return 'mobility';
  }
  if (tags.amenity === 'bank' || tags.amenity === 'post_office') {
    return 'services';
  }

  return null;
}

/**
 * Normaliza o nome do POI para apresentação e comparação.
 * Remove espaços duplicados e ajusta capitalização leve sem alterar nomes próprios/comerciais.
 */
function normalizePoiName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim().replace(/\s+/g, ' ');
  // Se estiver TOTALMENTE em maiúsculas (ex: "SUPERMERCADO X"), ajusta para Title Case
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    return trimmed
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Preserva preces ou artigos comuns em minúsculas se necessário, ou capitaliza tudo
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
  return trimmed;
}

/**
 * Deduplica POIs da mesma categoria com nomes normalizados semelhantes a até 15 metros.
 */
function deduplicatePois(pois: PointOfInterest[]): PointOfInterest[] {
  const unique: PointOfInterest[] = [];

  for (const candidate of pois) {
    const candidateNormName = normalizePoiName(candidate.name).toLowerCase();
    
    const existingIndex = unique.findIndex(item => {
      if (item.category !== candidate.category) return false;
      const itemNormName = normalizePoiName(item.name).toLowerCase();
      if (itemNormName !== candidateNormName) return false;

      // Verifica distância entre os dois POIs (raio de 15 metros)
      const distanceBetween = calculateHaversineDistance(
        item.latitude,
        item.longitude,
        candidate.latitude,
        candidate.longitude
      );

      return distanceBetween <= 15;
    });

    if (existingIndex >= 0) {
      // Já existe um POI equivalente. Preserva o de melhor qualidade (ex: que tem endereço ou menor distância)
      const existing = unique[existingIndex];
      const candidateScore = (candidate.address ? 2 : 0) + (candidate.distanceMeters < existing.distanceMeters ? 1 : 0);
      const existingScore = (existing.address ? 2 : 0) + (existing.distanceMeters <= candidate.distanceMeters ? 1 : 0);

      if (candidateScore > existingScore) {
        unique[existingIndex] = candidate;
      }
    } else {
      unique.push(candidate);
    }
  }

  return unique;
}

/**
 * Mapeia tipos do Google Places para as categorias normalizadas do OraOra.
 */
function mapGoogleTypeToCategory(types: string[] = []): PointOfInterest['category'] | null {
  if (!types || !Array.isArray(types)) return null;
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('bar') || types.includes('meal_takeaway')) {
    return 'restaurant';
  }
  if (types.includes('supermarket') || types.includes('grocery_or_supermarket') || types.includes('convenience_store')) {
    return 'supermarket';
  }
  if (types.includes('pharmacy') || types.includes('drugstore')) {
    return 'pharmacy';
  }
  if (types.includes('hospital') || types.includes('doctor') || types.includes('health') || types.includes('dentist')) {
    return 'health';
  }
  if (types.includes('school') || types.includes('university') || types.includes('kindergarten')) {
    return 'education';
  }
  if (types.includes('gym') || types.includes('fitness_center')) {
    return 'gym';
  }
  if (types.includes('park') || types.includes('tourist_attraction') || types.includes('museum')) {
    return 'leisure';
  }
  if (types.includes('natural_feature') || types.includes('beach')) {
    return 'beach';
  }
  if (types.includes('shopping_mall') || types.includes('department_store')) {
    return 'shopping';
  }
  if (types.includes('transit_station') || types.includes('subway_station') || types.includes('train_station') || types.includes('bus_station')) {
    return 'mobility';
  }
  if (types.includes('bank') || types.includes('post_office') || types.includes('atm')) {
    return 'services';
  }
  return null;
}

/**
 * Consulta a Google Places API como segunda fonte de POIs (fallback) quando o OSM não retorna resultados.
 */
async function fetchGooglePlacesFallback(latitude: number, longitude: number): Promise<PointOfInterest[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const googleCacheKey = `google_places_${latitude.toFixed(4)}_${longitude.toFixed(4)}_5000`;
  const cached = memoryPoiCache.get(googleCacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS && cached.pois && cached.pois.length > 0) {
    return cached.pois;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const results = data.results || [];
    const rawPois: PointOfInterest[] = [];
    const fetchedAt = new Date().toISOString();

    for (const place of results) {
      const name = place.name;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        continue;
      }

      const category = mapGoogleTypeToCategory(place.types);
      if (!category) {
        continue;
      }

      const lat = place.geometry?.location?.lat;
      const lon = place.geometry?.location?.lng;
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        continue;
      }

      const distanceMeters = calculateHaversineDistance(latitude, longitude, lat, lon);

      rawPois.push({
        id: `google_${place.place_id || Math.random()}`,
        name: normalizePoiName(name),
        category,
        latitude: lat,
        longitude: lon,
        address: place.vicinity || place.formatted_address || undefined,
        distanceMeters,
        source: 'google_places',
        updatedAt: fetchedAt,
        reliability: 'medium',
      });
    }

    const deduplicatedPois = deduplicatePois(rawPois);
    deduplicatedPois.sort((a, b) => a.distanceMeters - b.distanceMeters);

    const categoryCounts: Record<string, number> = {};
    const filteredPois: PointOfInterest[] = [];

    for (const poi of deduplicatedPois) {
      const count = categoryCounts[poi.category] || 0;
      if (count < MAX_POIS_PER_CATEGORY) {
        categoryCounts[poi.category] = count + 1;
        filteredPois.push(poi);
      }
    }

    if (filteredPois.length === 0) {
      memoryPoiCache.delete(googleCacheKey);
      return [];
    } else {
      memoryPoiCache.set(googleCacheKey, {
        timestamp: now,
        pois: filteredPois,
      });
      return filteredPois;
    }
  } catch (error) {
    console.error('Failed to fetch POIs from Google Places API:', error);
    return [];
  }
}

export class PoiService {
  /**
   * Consulta a Overpass API para buscar POIs ao redor de uma coordenada.
   */
  public static async getPoisAroundCoordinates(
    latitude: number,
    longitude: number,
    radiusMeters: number = DEFAULT_RADIUS_METERS
  ): Promise<PointOfInterest[]> {
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return [];
    }

    const radiiToTry = radiusMeters === DEFAULT_RADIUS_METERS ? [1500, 3000, 5000] : [radiusMeters];

    for (const r of radiiToTry) {
      const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${r}`;
      const cached = memoryPoiCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_TTL_MS && cached.pois && cached.pois.length > 0) {
        return cached.pois;
      }

      // Monta a query Overpass QL para múltiplos elementos no raio r
      const overpassQuery = `
        [out:json][timeout:6];
        (
          node(around:${r},${latitude},${longitude})[amenity];
          way(around:${r},${latitude},${longitude})[amenity];
          node(around:${r},${latitude},${longitude})[shop];
          way(around:${r},${latitude},${longitude})[shop];
          node(around:${r},${latitude},${longitude})[leisure];
          way(around:${r},${latitude},${longitude})[leisure];
          relation(around:${r},${latitude},${longitude})[leisure];
          node(around:${r},${latitude},${longitude})[natural=beach];
          way(around:${r},${latitude},${longitude})[natural=beach];
          relation(around:${r},${latitude},${longitude})[natural=beach];
        );
        out center;
      `;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Overpass API error status: ${response.status} at radius ${r}`);
          continue;
        }

        const data = await response.json();
        const elements = data.elements || [];

        const rawPois: PointOfInterest[] = [];
        const fetchedAt = new Date().toISOString();

        for (const el of elements) {
          const tags = el.tags || {};
          const name = tags.name;

          // Regra: Só retornar POI se existir nome identificável
          if (!name || typeof name !== 'string' || name.trim() === '') {
            continue;
          }

          const category = mapOsmTagToCategory(tags);
          if (!category) {
            continue;
          }

          const lat = el.lat || el.center?.lat;
          const lon = el.lon || el.center?.lon;

          if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
            continue;
          }

          const distanceMeters = calculateHaversineDistance(latitude, longitude, lat, lon);

          rawPois.push({
            id: `osm_${el.id || Math.random()}`,
            name: normalizePoiName(name),
            category,
            latitude: lat,
            longitude: lon,
            address: tags['addr:street'] ? `${tags['addr:street']}${tags['addr:housenumber'] ? `, ${tags['addr:housenumber']}` : ''}` : undefined,
            distanceMeters,
            source: 'openstreetmap',
            updatedAt: fetchedAt,
            reliability: 'medium', // Seguindo convenção padrão de reliability do KnowledgeService
          });
        }

        // Aplica deduplicação geográfica e por nome (15 metros)
        const deduplicatedPois = deduplicatePois(rawPois);

        // Ordenar por distância ASC e limitar por categoria
        deduplicatedPois.sort((a, b) => a.distanceMeters - b.distanceMeters);

        const categoryCounts: Record<string, number> = {};
        const filteredPois: PointOfInterest[] = [];

        for (const poi of deduplicatedPois) {
          const count = categoryCounts[poi.category] || 0;
          if (count < MAX_POIS_PER_CATEGORY) {
            categoryCounts[poi.category] = count + 1;
            filteredPois.push(poi);
          }
        }

        if (filteredPois.length === 0) {
          memoryPoiCache.delete(cacheKey);
          continue;
        } else {
          // Salva no cache em memória apenas se houver POIs encontrados
          memoryPoiCache.set(cacheKey, {
            timestamp: now,
            pois: filteredPois,
          });
          return filteredPois;
        }
      } catch (error) {
        console.error(`Failed to fetch POIs from Overpass API at radius ${r}:`, error);
        continue;
      }
    }

    // Se o OSM (1500m -> 3000m -> 5000m) não encontrou nada, tenta o Google Places (segunda fonte)
    return await fetchGooglePlacesFallback(latitude, longitude);
  }
}
