import { extractPropertySearchIntent, OraConversationMessage, SearchIntentField, TurnType } from './intent-extractor.server';
import { searchPublicProperties } from './search';
import { rankPublicProperties } from './ranking';
import { PropertySearchIntent, PublicProperty } from './types';

export interface ProcessOraSearchInput {
  message: string;
  previousIntent?: PropertySearchIntent;
  conversation?: OraConversationMessage[];
  resultLimit?: number;
}

export interface ProcessOraSearchResult {
  intent: PropertySearchIntent;
  searchReady: boolean;
  missingFields: SearchIntentField[];
  properties: PublicProperty[];
  totalReturned: number;
  turnType: TurnType;
  resolvedLocation?: { neighborhood?: string; city?: string };
}

export async function processOraSearch(
  input: ProcessOraSearchInput
): Promise<ProcessOraSearchResult> {
  const extraction = await extractPropertySearchIntent({
    message: input.message,
    previousIntent: input.previousIntent,
    conversation: input.conversation,
  });

  // ROTEAMENTO AUTORITATIVO POR TURNTYPE
  if (extraction.turnType !== 'property_search' && extraction.turnType !== 'property_detail') {
    return {
      intent: extraction.intent, // Mantém intent preservado
      searchReady: extraction.searchReady,
      missingFields: extraction.missingFields,
      properties: [],
      totalReturned: 0,
      turnType: extraction.turnType,
      resolvedLocation: extraction.resolvedLocation,
    };
  }

  if (!extraction.searchReady) {
    return {
      intent: extraction.intent,
      searchReady: false,
      missingFields: extraction.missingFields,
      properties: [],
      totalReturned: 0,
      turnType: extraction.turnType,
      resolvedLocation: extraction.resolvedLocation,
    };
  }

  const rawProperties = await searchPublicProperties(extraction.intent, {
    resultLimit: input.resultLimit,
  });

  const rankedResults = rankPublicProperties(rawProperties, extraction.intent);
  const properties = rankedResults.map(r => r.property);

  return {
    intent: extraction.intent,
    searchReady: true,
    missingFields: extraction.missingFields,
    properties,
    totalReturned: properties.length,
    turnType: extraction.turnType,
    resolvedLocation: extraction.resolvedLocation,
  };
}
