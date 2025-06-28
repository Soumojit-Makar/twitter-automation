// Mock backend service to simulate API responses
export interface Tweet {
  id: number;
  topic: string;
  content: string;
  posted: boolean;
  created_at: string;
}

export interface TweetListResponse {
  items: Tweet[];
  current_page: number;
  total_pages: number;
  total_items: number;
}
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

class MockBackendService {
  async getTweets(params: {
    limit?: number;
    offset?: number;
    search?: string;
    posted?: boolean | undefined;
  }): Promise<TweetListResponse> {
    const res = await axios.get(`${BACKEND}/tweet/tweets`, {
      params: {
        limit: params.limit || 10,
        offset: params.offset || 0,
        search: params.search,
        posted: params.posted !== undefined ? params.posted : undefined
      },
    });
    return res.data;
  }

  async generateTweet(topic: string): Promise<Tweet> {
    const res = await axios.post(`${BACKEND}/tweet/generate-tweet`, { topic });
    return res.data;
  }

  async postTweet(tweet_id: number): Promise<void> {
    await axios.post(`${BACKEND}/tweet/post-tweet/${tweet_id}`);
  }

  async editTweet(
    tweet_id: number,
    updates: { topic?: string | null; content?: string | null }
  ): Promise<Tweet> {
    const res = await axios.put(`${BACKEND}/tweet/edit/${tweet_id}`, updates);
    return res.data;
  }
}

export const mockBackend = new MockBackendService();
