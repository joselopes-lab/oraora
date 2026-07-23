import React from 'react';

interface HeroProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  imageUrl?: string;
}

interface HeroSectionProps {
  hero?: HeroProps;
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <div className="hero-section">
      <h1 dangerouslySetInnerHTML={{ __html: hero?.title ?? '' }} />
      <p>{hero?.subtitle ?? ''}</p>
    </div>
  );
}
