import GooglePlacesService from "./googlePlacesService";
import WikipediaService from "./wikipediaService";

export interface Destination {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  image: string;
  rating: number;
  description: string;
  featured?: boolean;
}

export interface ContinentSection {
  title: string;
  destinations: Destination[];
}

export interface ExploreData {
  featuredDestination: Destination | null;
  popularDestinations: Destination[];
  popularAttractions: Destination[];
  continentSections: ContinentSection[];
}

export interface ExploreCacheState {
  loading: boolean;
  data: ExploreData | null;
}

type Listener = (state: ExploreCacheState) => void;

let cacheState: ExploreCacheState = { loading: false, data: null };
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l(cacheState));
}

export function subscribeToExploreCache(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getExploreCacheState(): ExploreCacheState {
  return cacheState;
}

function getCountryCode(country: string): string {
  const countryMap: Record<string, string> = {
    France: "FR",
    Belgium: "BE",
    Greece: "GR",
    "United States": "US",
    USA: "US",
    Japan: "JP",
    Italy: "IT",
    Spain: "ES",
    Netherlands: "NL",
    Thailand: "TH",
    Singapore: "SG",
    "United Arab Emirates": "AE",
    UAE: "AE",
    "South Africa": "ZA",
    Morocco: "MA",
    Argentina: "AR",
    Brazil: "BR",
    Australia: "AU",
    "New Zealand": "NZ",
    "United Kingdom": "GB",
    UK: "GB",
    Hungary: "HU",
    "Czech Republic": "CZ",
    Philippines: "PH",
    India: "IN",
    Indonesia: "ID",
    Malaysia: "MY",
    Portugal: "PT",
    Austria: "AT",
    Russia: "RU",
    Sweden: "SE",
    Norway: "NO",
    Finland: "FI",
    Poland: "PL",
    Germany: "DE",
    China: "CN",
    Turkey: "TR",
    "South Korea": "KR",
    Mexico: "MX",
    Egypt: "EG",
    Peru: "PE",
    Bangalore: "IN",
    Manila: "PH",
    Budapest: "HU",
    Prague: "CZ",
    Jakarta: "ID",
    "Kuala Lumpur": "MY",
    Mumbai: "IN",
    Istanbul: "TR",
    Sydney: "AU",
    "Cape Town": "ZA",
    Cairo: "EG",
    "Rio de Janeiro": "BR",
    "Buenos Aires": "AR",
    "Mexico City": "MX",
    Lima: "PE",
    Lisbon: "PT",
    Vienna: "AT",
    Athens: "GR",
    Moscow: "RU",
    Madrid: "ES",
    Berlin: "DE",
    Beijing: "CN",
    Bangkok: "TH",
    Dubai: "AE",
    Seoul: "KR",
  };
  return countryMap[country] || "🌍";
}

function groupByContinent(destinations: Destination[]): ContinentSection[] {
  const continentMap: Record<string, string[]> = {
    Europe: [
      "France",
      "Belgium",
      "Greece",
      "Italy",
      "Spain",
      "Netherlands",
      "United Kingdom",
      "UK",
    ],
  };

  const groups: Record<string, Destination[]> = {};

  destinations.forEach((destination) => {
    for (const [continent, countries] of Object.entries(continentMap)) {
      if (countries.includes(destination.country)) {
        if (!groups[continent]) {
          groups[continent] = [];
        }
        groups[continent].push(destination);
        break;
      }
    }
  });

  return Object.entries(groups).map(([continent, destinationList]) => ({
    title: continent,
    destinations: destinationList,
  }));
}

const STATIC_FALLBACK: Destination[] = [
  {
    id: "paris",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400",
    rating: 4.8,
    description: "The City of Light",
    featured: true,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
    rating: 4.9,
    description: "A city of contrasts",
  },
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    countryCode: "IT",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
    rating: 4.7,
    description: "The Eternal City",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    image: "https://images.unsplash.com/photo-1586523894110-97e98af36b13?w=400",
    rating: 4.7,
    description: "Gaudí, beaches and tapas",
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400",
    rating: 4.6,
    description: "Historic and cosmopolitan",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    countryCode: "AE",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400",
    rating: 4.8,
    description: "Ultra-modern desert city",
  },
  {
    id: "newyork",
    name: "New York",
    country: "United States",
    countryCode: "US",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400",
    rating: 4.7,
    description: "The Big Apple",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400",
    rating: 4.6,
    description: "Canals and culture",
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Turkey",
    countryCode: "TR",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400",
    rating: 4.7,
    description: "Where east meets west",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    countryCode: "AU",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400",
    rating: 4.8,
    description: "Iconic harbour and opera house",
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400",
    rating: 4.6,
    description: "Temple and street food capital",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400",
    rating: 4.7,
    description: "Modern city-state",
  },
  {
    id: "prague",
    name: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=400",
    rating: 4.7,
    description: "City of a hundred spires",
  },
  {
    id: "budapest",
    name: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    image: "https://images.unsplash.com/photo-1520962922320-2038eebab146?w=400",
    rating: 4.7,
    description: "Pearl of the Danube",
  },
  {
    id: "vienna",
    name: "Vienna",
    country: "Austria",
    countryCode: "AT",
    image: "https://images.unsplash.com/photo-1516550893885-985c836c9e53?w=400",
    rating: 4.7,
    description: "Music and imperial history",
  },
  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400",
    rating: 4.6,
    description: "City of seven hills",
  },
  {
    id: "athens",
    name: "Athens",
    country: "Greece",
    countryCode: "GR",
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=400",
    rating: 4.5,
    description: "Birthplace of democracy",
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    countryCode: "DE",
    image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400",
    rating: 4.6,
    description: "Art, history and nightlife",
  },
  {
    id: "seoul",
    name: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    image: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=400",
    rating: 4.7,
    description: "K-pop, tech and tradition",
  },
  {
    id: "mexico_city",
    name: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    image: "https://images.unsplash.com/photo-1518659526054-190340b32735?w=400",
    rating: 4.5,
    description: "Ancient culture and cuisine",
  },
  {
    id: "cape_town",
    name: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400",
    rating: 4.8,
    description: "Table Mountain and the ocean",
  },
  {
    id: "rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    countryCode: "BR",
    image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400",
    rating: 4.6,
    description: "Carnival and Copacabana",
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    countryCode: "EG",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=400",
    rating: 4.5,
    description: "Land of pharaohs",
  },
  {
    id: "moscow",
    name: "Moscow",
    country: "Russia",
    countryCode: "RU",
    image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400",
    rating: 4.4,
    description: "Red Square and the Kremlin",
  },
];

async function doFetch(): Promise<void> {
  cacheState = { loading: true, data: null };
  notify();

  try {
    const popularPlaces = await GooglePlacesService.getPopularDestinations();

    const destinations: Destination[] = await Promise.all(
      popularPlaces.slice(0, 30).map(async (place: any, index: number) => {
        const wikiInfo =
          index < 8
            ? await WikipediaService.getDestinationInfo(place.name)
            : { summary: null, image: null };

        let country = "Unknown";
        if (place.formatted_address) {
          const addressParts = place.formatted_address.split(",");
          country = addressParts[addressParts.length - 1].trim();
        } else if (place.name) {
          country = place.name.split(",").pop()?.trim() || "Unknown";
        }

        const countryCode = getCountryCode(country);

        return {
          id: place.place_id,
          name: place.name,
          country,
          countryCode,
          image: place.photos?.[0]
            ? GooglePlacesService.getPhotoUrl(
                place.photos[0].photo_reference,
                400,
              )
            : wikiInfo.image ||
              "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400",
          rating: place.rating || 4.5,
          description:
            wikiInfo.summary ||
            `${place.name} - A popular destination in ${country}`,
          featured: index === 0,
        };
      }),
    );

    const featured = destinations.find((d) => d.featured) || destinations[0];
    const popularDestinations = destinations.slice(0, 32);

    let popularAttractions: Destination[] = [];
    try {
      const attractionsResponse = await GooglePlacesService.searchPlaces(
        "tourist attractions landmarks monuments worldwide global",
      );
      popularAttractions = attractionsResponse
        .slice(0, 8)
        .map((place: any) => ({
          id: place.place_id,
          name: place.name,
          country:
            place.formatted_address?.split(",").pop()?.trim() || "Unknown",
          countryCode: getCountryCode(
            place.formatted_address?.split(",").pop()?.trim() || "Unknown",
          ),
          image: place.photos?.[0]
            ? GooglePlacesService.getPhotoUrl(
                place.photos[0].photo_reference,
                400,
              )
            : "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
          rating: place.rating || 4.5,
          description:
            place.formatted_address || "Famous attraction and landmark",
        }));
    } catch {
      popularAttractions = destinations.slice(0, 8);
    }

    const continentSections = groupByContinent(destinations.slice(8));

    cacheState = {
      loading: false,
      data: {
        featuredDestination: featured,
        popularDestinations,
        popularAttractions,
        continentSections,
      },
    };
  } catch {
    cacheState = {
      loading: false,
      data: {
        featuredDestination: STATIC_FALLBACK[0],
        popularDestinations: STATIC_FALLBACK,
        popularAttractions: STATIC_FALLBACK.slice(0, 8),
        continentSections: [],
      },
    };
  }

  notify();
}

/** Call this as early as possible (e.g. on home screen mount) to warm up the cache. */
export function prefetchExploreData(): void {
  if (fetchPromise || cacheState.data) return;
  fetchPromise = doFetch();
}
