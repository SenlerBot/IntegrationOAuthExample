import { SenlerApiClientV2 } from 'senler-sdk';

export interface SenlerUser {
  accessToken: string;
  groupId: number;
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  subscribers: any[];
}

/**
 * Service for working with Senler API
 * Provides methods to interact with Senler subscribers and groups
 */
export class SenlerService {
  private client: SenlerApiClientV2;

  /**
   * Creates a new SenlerService instance
   * @param user - User credentials containing access token and group ID
   */
  constructor(user: SenlerUser) {
    this.client = new SenlerApiClientV2({
      apiConfig: {
        accessToken: user.accessToken,
        groupId: user.groupId,
        baseUrl: process.env.SENLER_API_URL || 'https://senler.ru/api'
      }
    });
  }

  /**
   * Get subscribers statistics from Senler API
   * @param count - Number of subscribers to fetch (default: 30)
   * @returns Promise with subscribers statistics including total, active, inactive counts and subscriber list
   * @throws Error if API request fails
   */
  async getSubscribersStats(count: number = 30): Promise<SubscriberStats> {
    try {
      const subscribersResponse = await this.client.subscribers.get({
        count
      });

      const subscribers = subscribersResponse?.items || [];
      const total = subscribers.length;
      const active = subscribers.filter((s: any) => s.is_active).length;
      const inactive = total - active;

      return {
        total,
        active,
        inactive,
        subscribers
      };
    } catch (error: any) {
      console.error('❌ Ошибка получения подписчиков:', error.message);
      throw error;
    }
  }

  /**
   * Get group information from Senler API
   * @returns Promise with group information or null if not implemented
   * @throws Error if API request fails
   */
  async getGroupInfo() {
    try {
      // Здесь можно добавить запрос информации о группе
      // const groupInfo = await this.client.groups.get();
      // return groupInfo;
      return null;
    } catch (error: any) {
      console.error('❌ Ошибка получения информации о группе:', error.message);
      throw error;
    }
  }
}

/**
 * Factory function to create a new SenlerService instance
 * @param user - User credentials containing access token and group ID
 * @returns New SenlerService instance configured with user credentials
 */
export const createSenlerService = (user: SenlerUser): SenlerService => {
  return new SenlerService(user);
}; 