import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop()
  deviceId: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  fcmToken?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Event', default: [] })
  participatedEvents: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Event', default: [] })
  completedEvents: Types.ObjectId[];

  @Prop({ default: true })
  termsAccepted: boolean;

  @Prop()
  termsAcceptedAt?: Date;

  @Prop({ default: 0 })
  tilesInteracted: number;

  @Prop()
  otp: string;

  @Prop()
  expiresAt: number;
}

export const UserSchema = SchemaFactory.createForClass(User);