import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'new_lead' 
  | 'admin_project' 
  | 'constructor_project' 
  | 'system';

export type NotificationModel = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Timestamp | Date | string;
  eventId: string;
  sourceId: string;
  sourceType: string;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  eventId: string;
  sourceId: string;
  sourceType: string;
};
