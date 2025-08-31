import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Organization } from '../../organizations/schemas/organization.schema';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: Organization.name, required: true })
  organization: Types.ObjectId;

  @Prop()
  qrCode: string;

  @Prop()
  instructions: string;

  @Prop()
  termsAndConditions: string;

  @Prop()
  tileBackgroundImage: string;

  @Prop({ default: 0 })
  totalTiles: number;

  @Prop({ default: 0 })
  successfulDeeps: number;

  @Prop({ default: 0 })
  undeeped: number;

  @Prop({ default: 0 })
  giftsRedeemed: number;

  @Prop({ default: 0 })
  giftsUnredeemed: number;

  @Prop({ default: 'active' })
  status: 'active' | 'completed' | 'cancelled';
}

export const EventSchema = SchemaFactory.createForClass(Event);