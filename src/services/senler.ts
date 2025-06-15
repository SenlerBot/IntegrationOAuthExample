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
 * Сервис для работы с Senler API
 */
export class SenlerService {
  private client: SenlerApiClientV2;

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
   * Получить статистику подписчиков
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
   * Получить информацию о группе
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
 * Создать экземпляр SenlerService
 */
export const createSenlerService = (user: SenlerUser): SenlerService => {
  return new SenlerService(user);
}; 