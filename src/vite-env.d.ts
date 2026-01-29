/// <reference types="vite/client" />

/** PWA install prompt (beforeinstallprompt event). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
