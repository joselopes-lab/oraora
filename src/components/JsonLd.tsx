
'use client';

import React from 'react';

/**
 * @fileOverview Injeta dados estruturados JSON-LD na página para SEO.
 */
export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
