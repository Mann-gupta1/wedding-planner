export const BUDGET_BRACKETS = [
  {
    id: "under-10L",
    label: "Under ₹10L",
    title: "Boutique & Elegant",
    description: "Intimate celebrations with curated vendors and refined décor.",
    budgetInr: 1_000_000,
    popular: false,
  },
  {
    id: "10L-25L",
    label: "₹10L – ₹25L",
    title: "Luxury Gala",
    description: "A grand reception with premium catering and cinematic photography.",
    budgetInr: 2_500_000,
    popular: true,
  },
  {
    id: "25L-50L",
    label: "₹25L – ₹50L",
    title: "Eternal Grandeur",
    description: "Multi-day festivities with designer outfits and live entertainment.",
    budgetInr: 5_000_000,
    popular: false,
  },
  {
    id: "50L-1Cr",
    label: "₹50L – ₹1Cr",
    title: "Royal Heritage",
    description: "Palace venues, celebrity chefs, and bespoke floral architecture.",
    budgetInr: 10_000_000,
    popular: false,
  },
  {
    id: "1Cr-plus",
    label: "₹1Cr+",
    title: "Dynastic Celebration",
    description: "Destination weddings with full concierge and white-glove service.",
    budgetInr: 15_000_000,
    popular: false,
  },
] as const;

export type BudgetBracketId = (typeof BUDGET_BRACKETS)[number]["id"];

export const VENUE_TYPES = [
  { name: "Banquet hall", tagline: "Classic elegance", gradient: "from-amber-100 to-orange-50" },
  { name: "Farmhouse", tagline: "Chic rustic", gradient: "from-emerald-100 to-green-50" },
  { name: "Hotel", tagline: "Urban luxury", gradient: "from-slate-100 to-gray-50" },
  { name: "Destination", tagline: "Wanderlust", gradient: "from-sky-100 to-blue-50" },
  { name: "Temple / traditional", tagline: "Sacred heritage", gradient: "from-orange-100 to-amber-50" },
  { name: "Outdoor / garden", tagline: "Botanical bliss", gradient: "from-lime-100 to-emerald-50" },
] as const;

export const VENUE_TYPE_NAMES = VENUE_TYPES.map((v) => v.name);

export const WEDDING_VIBES = [
  { id: "nocturnal", label: "Nocturnal Elegance", icon: "🌙" },
  { id: "golden", label: "Golden Hour", icon: "☀️" },
  { id: "royal", label: "Royal Heritage", icon: "👑" },
  { id: "botanical", label: "Botanical Bliss", icon: "🌿" },
  { id: "minimal", label: "Modern Minimalist", icon: "◇" },
] as const;

export const POPULAR_CITIES = ["Mumbai", "Delhi", "Jaipur", "Goa", "Udaipur", "Bangalore"];

export const PRIORITY_OPTIONS = [
  "Photography",
  "Catering",
  "Décor",
  "Venue",
  "Entertainment",
  "Outfits",
  "Mehendi",
  "Invitations",
] as const;

export const VENDOR_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Décor",
  "Entertainment",
  "Outfits",
  "Mehendi",
  "Invitations",
  "Makeup & styling",
  "Transportation",
  "Miscellaneous",
] as const;
