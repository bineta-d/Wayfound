interface WikimediaResponse {
  query: {
    pages: {
      [key: string]: {
        pageid: number;
        title: string;
        extract?: string;
        description?: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        terms?: {
          description?: string[];
        };
      };
    };
  };
}

interface WikimediaSearchResponse {
  query: {
    search: Array<{
      pageid: number;
      title: string;
      snippet: string;
    }>;
  };
}

class WikipediaService {
  private baseUrl = 'https://en.wikipedia.org/w/api.php';
  private apiUnavailable = false;
  private hasLoggedUnavailable = false;
  private destinationCache = new Map<string, { summary: string | null; image: string | null }>();

  private async fetchJson<T>(url: string): Promise<T | null> {
    if (this.apiUnavailable) {
      return null;
    }

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Wikipedia API HTTP ${response.status}`);
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        // Some Wikimedia edges return plain text/HTML (e.g., rate limit pages).
        throw new Error(`Wikipedia API returned non-JSON: ${text.slice(0, 60)}`);
      }
    } catch (error) {
      this.apiUnavailable = true;
      if (!this.hasLoggedUnavailable) {
        this.hasLoggedUnavailable = true;
        console.warn('Wikipedia API temporarily unavailable, skipping wiki enrichment.', error);
      }
      return null;
    }
  }

  async getDestinationSummary(destination: string): Promise<string | null> {
    try {
      const info = await this.getDestinationInfo(destination);
      return info.summary;
    } catch (error) {
      if (!this.hasLoggedUnavailable) {
        console.error('Error fetching Wikipedia summary:', error);
      }
      return null;
    }
  }

  async getDestinationImage(destination: string): Promise<string | null> {
    try {
      const info = await this.getDestinationInfo(destination);
      return info.image;
    } catch (error) {
      if (!this.hasLoggedUnavailable) {
        console.error('Error fetching Wikipedia image:', error);
      }
      return null;
    }
  }

  async getDestinationInfo(destination: string): Promise<{
    summary: string | null;
    image: string | null;
  }> {
    try {
      const key = destination.trim().toLowerCase();
      const cached = this.destinationCache.get(key);
      if (cached) {
        return cached;
      }

      if (this.apiUnavailable) {
        return { summary: null, image: null };
      }

      const searchUrl = `${this.baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(destination)}&format=json&origin=*`;
      const searchData = await this.fetchJson<WikimediaSearchResponse>(searchUrl);
      if (!searchData?.query?.search?.length) {
        const empty = { summary: null, image: null };
        this.destinationCache.set(key, empty);
        return empty;
      }

      const pageId = searchData.query.search[0].pageid;
      const contentUrl = `${this.baseUrl}?action=query&prop=extracts|description|pageimages&exintro&explaintext&pithumbsize=800&pageids=${pageId}&format=json&origin=*`;
      const contentData = await this.fetchJson<WikimediaResponse>(contentUrl);
      const page = contentData?.query?.pages?.[pageId];

      const summary = page?.extract || page?.description || page?.terms?.description?.[0] || null;
      const image = page?.thumbnail?.source || null;
      const result = { summary, image };
      this.destinationCache.set(key, result);
      return result;
    } catch (error) {
      console.error('Error fetching destination info:', error);
      return { summary: null, image: null };
    }
  }
}

export default new WikipediaService();
