import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationStatus {
  isSupported: boolean;
  hasPermission: boolean;
  isWeeklyReminderActive: boolean;
}

const WEEKLY_REMINDER_ID = 44201;

/**
 * Requests notification permissions from iOS / browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } else if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
  } catch (err) {
    console.warn('Failed to request notification permissions:', err);
  }
  return false;
}

/**
 * Checks current notification permission state
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } else if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
  } catch (err) {
    console.warn('Failed to check notification permissions:', err);
  }
  return false;
}

/**
 * Schedules a recurring weekly reminder (Every Sunday at 7:00 PM)
 * to remind user to update their spending in Crisis.
 */
export async function scheduleWeeklyReminder(): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    if (Capacitor.isNativePlatform()) {
      // Cancel existing reminder first if any
      await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REMINDER_ID }] }).catch(() => {});

      // Schedule weekly on Sunday (weekday 1) at 19:00 (7 PM)
      await LocalNotifications.schedule({
        notifications: [
          {
            id: WEEKLY_REMINDER_ID,
            title: 'Crisis Spending Check',
            body: 'Take 1 minute to log your recent expenses and keep your savings on track!',
            schedule: {
              on: {
                weekday: 1, // Sunday
                hour: 19,
                minute: 0,
              },
              allowWhileIdle: true,
            },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: {
              type: 'weekly_review',
            },
          },
        ],
      });
      localStorage.setItem('crisis_weekly_reminder', 'true');
      return true;
    } else {
      localStorage.setItem('crisis_weekly_reminder', 'true');
      return true;
    }
  } catch (err) {
    console.warn('Failed to schedule weekly reminder:', err);
    return false;
  }
}

/**
 * Cancels the weekly reminder
 */
export async function cancelWeeklyReminder(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REMINDER_ID }] }).catch(() => {});
    }
    localStorage.removeItem('crisis_weekly_reminder');
  } catch (err) {
    console.warn('Failed to cancel weekly reminder:', err);
  }
}

/**
 * Checks if weekly reminder is currently enabled
 */
export function isWeeklyReminderEnabled(): boolean {
  return localStorage.getItem('crisis_weekly_reminder') === 'true';
}
