export type NotifyPermission = NotificationPermission | 'unsupported'

export function getNotificationPermission(): NotifyPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/** Must be called from a user gesture so the browser will show its prompt. */
export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (getNotificationPermission() === 'unsupported') {
    return 'unsupported'
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return getNotificationPermission()
  }
}

/**
 * Shows the "timer finished" notification. Prefers the service worker
 * registration (required by Chrome on Android), then falls back to the
 * page-level Notification constructor.
 */
export async function showTimerNotification(
  durationLabel: string,
): Promise<void> {
  if (getNotificationPermission() !== 'granted') {
    return
  }
  const title = "Time's up"
  const options: NotificationOptions = {
    body: `Your ${durationLabel} countdown is complete.`,
    tag: 'timer-finished',
    icon: '/icons/icon-192.png',
  }

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
  } catch {
    // Fall through to the page-level notification
  }

  try {
    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch {
    // Notifications are not available in this context
  }
}

/** Short vibration pattern for phones; a no-op where unsupported. */
export function vibrateOnFinish(): void {
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    // Ignore
  }
}
