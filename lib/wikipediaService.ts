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
  private baseUrl = 'https://en.wikivoyage.org/w/api.php';

  async getDestinationSummary(destination: string): Promise<string | null> {
    try {
      // First, search for the destination
      const searchUrl = `${this.baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(destination)}&format=json&origin=*`;

      const searchResponse = await fetch(searchUrl);
      const searchData: WikimediaSearchResponse = await searchResponse.json();

      if (!searchData.query.search.length) {
        return null;
      }

      // Get the first result's page ID
      const pageId = searchData.query.search[0].pageid;

      // Get the page content
      const contentUrl = `${this.baseUrl}?action=query&prop=extracts|description|pageimages&exintro&explaintext&piprop=original&pageids=${pageId}&format=json&origin=*`;

      const contentResponse = await fetch(contentUrl);
      const contentData: WikimediaResponse = await contentResponse.json();

      const page = contentData.query.pages[pageId];

      if (page.extract) {
        return page.extract;
      } else if (page.description) {
        return page.description;
      } else if (page.terms?.description?.[0]) {
        return page.terms.description[0];
      }

      return null;
    } catch (error) {
      console.error('Error fetching Wikipedia summary:', error);
      return null;
    }
  }

  async getDestinationImage(destination: string): Promise<string | null> {
    try {
      // Search for the destination
      const searchUrl = `${this.baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(destination)}&format=json&origin=*`;

      const searchResponse = await fetch(searchUrl);
      const searchData: WikimediaSearchResponse = await searchResponse.json();

      if (!searchData.query.search.length) {
        return null;
      }

      // Get the first result's page ID
      const pageId = searchData.query.search[0].pageid;

      // Get the page image
      const imageUrl = `${this.baseUrl}?action=query&prop=pageimages&pithumbsize=800&pageids=${pageId}&format=json&origin=*`;

      const imageResponse = await fetch(imageUrl);
      const imageData: WikipediaResponse = await imageResponse.json();

      const page = imageData.query.pages[pageId];

      if (page.thumbnail?.source) {
        return page.thumbnail.source;
      }

      return null;
    } catch (error) {
      console.error('Error fetching Wikipedia image:', error);
      return null;
    }
  }

  async getDestinationInfo(destination: string): Promise<{
    summary: string | null;
    image: string | null;
  }> {
    try {
      const [summary, image] = await Promise.all([
        this.getDestinationSummary(destination),
        this.getDestinationImage(destination)
      ]);

      return { summary, image };
    } catch (error) {
      console.error('Error fetching destination info:', error);
      return { summary: null, image: null };
    }
  }
}

export default new WikipediaService();
