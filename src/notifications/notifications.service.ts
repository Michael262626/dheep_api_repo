import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class NotificationsService {
  private fcmServerKey: string;

  constructor(private readonly configService: ConfigService) {
    this.fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY');
  }

  async sendToDevice(fcmToken: string, title: string, body: string, data?: Record<string, any>) {
    const message = {
      to: fcmToken,
      notification: { title, body },
      data: data || {},
    };
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${this.fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    return result;
  }
}