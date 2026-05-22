import { LocalGuide, AffiliateOffer } from "./types";

export interface DemoPhoto {
  id: string;
  name: string;
  country: string;
  url: string; // Unsplash URLs
  lat?: number;
  lng?: number;
  description: string;
  hasExif: boolean;
  base64Data?: string; // Small inline placeholder base64 or high-fidelity simulated
}

export const DEMO_PHOTOS: DemoPhoto[] = [
  {
    id: "eiffel_tower",
    name: "Eiffel Tower Landmark",
    country: "France",
    url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop",
    lat: 48.8584,
    lng: 2.2945,
    description: "Classic travel shot of the iron monument in Paris.",
    hasExif: true,
  },
  {
    id: "golden_gate",
    name: "Golden Gate Bridge Overlook",
    country: "USA",
    url: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=600&auto=format&fit=crop",
    lat: 37.8199,
    lng: -122.4783,
    description: "Bridge looking out over the bay from Marin Headlands.",
    hasExif: true,
  },
  {
    id: "kyoto_forest",
    name: "Kyoto Scenic Bamboo Path",
    country: "Japan",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop",
    // To demonstrate AI image analysis, we leave lat/lng out. When the user loads this, we simulate NO GPS DATA inside EXIF,
    // which triggers the "AI vision recognition" flow.
    description: "Stellar green stalks rising into the sky. No location markers in EXIF.",
    hasExif: false,
  },
  {
    id: "colosseum_rome",
    name: "The Colosseum",
    country: "Italy",
    url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600&auto=format&fit=crop",
    lat: 41.8902,
    lng: 12.4922,
    description: "An impressive angle of the monumental Roman amphitheatre.",
    hasExif: true,
  },
];

export const MOCK_GUIDES: LocalGuide[] = [
  {
    id: "guide_1",
    name: "Elena Rostova",
    languages: ["English", "French", "Italian"],
    rating: 4.9,
    hourlyRate: 45,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop",
    bio: "Professional landscape photographer and history buff with 6 years experience conducting unique photography walkabouts.",
    specialty: "Photo Composition & Secret Snapping Angles",
  },
  {
    id: "guide_2",
    name: "Kenji Tanaka",
    languages: ["English", "Japanese"],
    rating: 5.0,
    hourlyRate: 60,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop",
    bio: "Ex-pat tour leader and architect. Focused on sunrise street wanderings and night photography setups.",
    specialty: "Architecture & Golden Hour Sunsets",
  },
  {
    id: "guide_3",
    name: "Marcus Dupont",
    languages: ["English", "Spanish", "German"],
    rating: 4.8,
    hourlyRate: 35,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop",
    bio: "Locally-raised hiker and travel guide. Knows the historical trails, backyards, and hidden vistas.",
    specialty: "Historical Context & Local Culinary Walkabouts",
  }
];

export const MOCK_OFFERS: AffiliateOffer[] = [
  {
    id: "offer_hotel",
    title: "Best Price Hotels Finder",
    description: "Unlock up to 30% off hotel bookings and local stays near this spot.",
    provider: "Booking.com Partner",
    link: "https://booking.com",
    buttonText: "Find Nearby Stays",
    price: "From $79/night",
  },
  {
    id: "offer_gear",
    title: "Local Camera & Lens Rental",
    description: "Need a wide-angle lens or a travel tripod? Rent professional photography gear locally.",
    provider: "LensesGo Partner",
    link: "https://lensrentals.com",
    buttonText: "Browse Available Gear",
    price: "$15/day",
  },
  {
    id: "offer_activities",
    title: "Skip-the-line Tickets & Entry Passes",
    description: "Get priority entry to museums, overlooks, and guided walks with cancel-anytime tickets.",
    provider: "GetYourGuide Partner",
    link: "https://getyourguide.com",
    buttonText: "Book Tickets",
    price: "From $24",
  }
];
