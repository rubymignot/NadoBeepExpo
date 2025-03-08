/**
 * NotifeeEventType - An enum representing notification event types
 */
export enum NotifeeEventType {
  UNKNOWN = 0,
  ACTION_PRESS = 1,
  PRESS = 2,
  DISMISSED = 3,
  DELIVERED = 4,
  TRIGGER_NOTIFICATION_CREATED = 5,
  CHANNEL_BLOCKED = 6,
  CHANNEL_GROUP_BLOCKED = 7,
  APP_BLOCKED = 8,
}
