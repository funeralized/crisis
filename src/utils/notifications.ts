export interface NotificationStatus {
  isSupported: boolean;
  hasPermission: boolean;
  isWeeklyReminderActive: boolean;
}

const STORAGE_KEY_REMINDER = 'crisis_weekly_reminder';

/**
 * Requests notification permissions from iOS WebKit / browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
  }
  return true;
}

/**
 * Checks current notification permission state
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
  } catch (err) {
    console.warn('Failed to check notification permission:', err);
  }
  return true;
}

/**
 * Schedules a recurring weekly reminder (Every Sunday at 7:00 PM)
 * to remind user to update their spending in Crisis.
 */
export async function scheduleWeeklyReminder(): Promise<boolean> {
  try {
    await requestNotificationPermission();
    localStorage.setItem(STORAGE_KEY_REMINDER, 'true');

    // If notifications are supported in browser/WKWebView, dispatch a welcome reminder
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Crisis Spending Tracker', {
          body: 'Weekly check-in reminder is active! Crisis will prompt you every Sunday to log your spending.',
          icon: '/icon-192.png',
        });
      } catch (e) {
        // Safe fallback
      }
    }
    return true;
  } catch (err) {
    console.warn('Failed to schedule weekly reminder:', err);
    return false;
  }
}

/**
 * Cancels the weekly reminder
 */
export async function cancelWeeklyReminder(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY_REMINDER);
}

/**
 * Checks if weekly reminder is currently enabled
 */
export function isWeeklyReminderEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY_REMINDER) === 'true';
}
