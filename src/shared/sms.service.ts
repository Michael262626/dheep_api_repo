import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private africasTalkingUsername: string;
  private africasTalkingApiKey: string;
  private africasTalkingSenderId: string;
  private twilioPhoneNumber: string;
  private isLive: boolean;

  constructor(private readonly configService: ConfigService) {
    // Africa's Talking Credentials
    this.africasTalkingUsername = this.configService.get<string>('AFRICAS_TALKING_USERNAME');
    this.africasTalkingApiKey = this.configService.get<string>('AFRICAS_TALKING_API_KEY');
    this.africasTalkingSenderId = this.configService.get<string>('AFRICAS_TALKING_SENDER_ID'); // e.g., 'ZawadiTap'
    
    // Determine if we are in production or sandbox for Africa's Talking
    this.isLive = this.configService.get<string>('NODE_ENV') === 'production';
    if (!this.isLive) {
      this.africasTalkingUsername = 'zawaditap'; // Sandbox requires 'sandbox' username
    }

    // Twilio Credentials (Fallback)
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && this.twilioPhoneNumber) {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  /**
   * Sends an SMS using Africa's Talking as the primary provider
   * and Twilio as the fallback.
   * @param to The recipient's phone number in E.164 format (e.g., +234...)
   * @param message The text message to send.
   * @returns A promise that resolves to true if the message was sent successfully.
   * @throws An error if both providers fail to send the message.
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    // 1. Try sending with Africa's Talking (Default)
    if (this.africasTalkingApiKey && this.africasTalkingUsername) {
      try {
        await this.sendWithAfricasTalking(to, message);
        this.logger.log(`Successfully sent SMS to ${to} via Africa's Talking.`);
        return true;
      } catch (error) {
        console.log({ error })
        this.logger.error("Africa's Talking API failed. Falling back to Twilio.", error.response?.data || error.message);
      }
    } else {
        this.logger.warn("Africa's Talking credentials not configured. Skipping.");
    }

    // 2. Try sending with Twilio (Fallback)
    if (this.twilioClient) {
      try {
        await this.sendWithTwilio(to, message);
        this.logger.log(`Successfully sent SMS to ${to} via Twilio (fallback).`);
        return true;
      } catch (error) {
        this.logger.error('Twilio (fallback) API also failed.', error.message);
      }
    } else {
        this.logger.warn("Twilio credentials not configured. Cannot fall back.");
    }

    // 3. If both fail
    this.logger.error(`All SMS providers failed for recipient: ${to}.`);
    throw new Error('Failed to send SMS via all available providers.');
  }

  private async sendWithAfricasTalking(to: string, message: string): Promise<void> {
    const url = 'https://api.africastalking.com/version1/messaging';
    // const url = this.isLive 
    //     ? 'https://api.africastalking.com/version1/messaging'
    //     : 'https://api.sandbox.africastalking.com/version1/messaging';

    console.log("url", url, to, message)
    const data = new URLSearchParams({
      username: this.africasTalkingUsername,
      to,
      message,
    });
    
    // Only add 'from' if a Sender ID is configured
    // if (this.africasTalkingSenderId) {
    //     data.append('from', this.africasTalkingSenderId);
    // }

    const headers = {
      'apiKey': this.africasTalkingApiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    };

    const response = await axios.post(url, data, { headers });
    this.logger.debug('Africa\'s Talking API Response:', response.data);
    const recipients = response.data.SMSMessageData?.Recipients;
    if (!recipients || recipients.length === 0 || !['Success', 'sent'].includes(recipients[0].status)) {
        throw new Error(`Africa's Talking failed to send to ${to}. Status: ${recipients?.[0]?.status || 'Unknown'}`);
    }
  }

  private async sendWithTwilio(to: string, message: string): Promise<void> {
    await this.twilioClient.messages.create({
      body: message,
      from: this.twilioPhoneNumber,
      to,
    });
  }
}
