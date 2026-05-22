export interface CandidateLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  confidence: number;
  reasoning: string;
}

export interface MustSeeSpot {
  name: string;
  description: string;
}

export interface LocationTips {
  history: string;
  tips: string[];
  solar: string;
  mustSee: MustSeeSpot[];
  safety: string;
}

export interface LocalGuide {
  id: string;
  name: string;
  languages: string[];
  rating: number;
  hourlyRate: number;
  avatar: string;
  bio: string;
  specialty: string;
}

export interface AffiliateOffer {
  id: string;
  title: string;
  description: string;
  provider: string;
  link: string;
  buttonText: string;
  price?: string;
}


