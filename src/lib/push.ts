// Browser push notifications wrapper. Uses the Notification API directly —
// no service-worker push subscription is required for in-tab + recently-closed
// notifications. Respects the user's notification settings.

const PERMISSION_KEY = 'pushNotifPermissionPrompted';

export const isPushSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const getPushPermission = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  localStorage.setItem(PERMISSION_KEY, '1');
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

export const wasPromptShown = () => localStorage.getItem(PERMISSION_KEY) === '1';

interface PushOpts {
  title: string;
  body?: string;
  tag?: string;
  icon?: string;
}

export const sendPush = ({ title, body, tag, icon }: PushOpts) => {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return; // toast handles foreground
  // Respect user setting
  if (localStorage.getItem('pushEnabled') === 'false') return;
  try {
    new Notification(title, {
      body,
      tag: tag || 'glitch-games',
      icon: icon || 'https://storage.googleapis.com/gpt-engineer-file-uploads/5pVD0WeWJBNmwpYZjvuNfuzPafj1/uploads/1767623935439-Untitled%20design%20%281%29.png',
      silent: false,
    });
  } catch {/* ignore */}
};
