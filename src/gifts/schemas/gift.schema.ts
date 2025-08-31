import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Event } from '../../events/schemas/event.schema';
import { User } from '../../users/schemas/user.schema';
import { Organization } from '../../organizations/schemas/organization.schema';

export type GiftDocument = Gift & Document;

@Schema({ timestamps: true })
export class Gift {
  @Prop({ type: Types.ObjectId, ref: Event.name, required: true })
  event: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: false })
  claimed: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name })
  claimedBy?: Types.ObjectId;

  @Prop()
  collectedAt?: Date;

  @Prop()
  qrCode?: string;

  @Prop({ type: Types.ObjectId, ref: Organization.name })
  redeemedBy?: Types.ObjectId;
}

export const GiftSchema = SchemaFactory.createForClass(Gift);