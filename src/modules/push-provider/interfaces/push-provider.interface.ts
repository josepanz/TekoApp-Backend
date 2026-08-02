export interface IWebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface IPushPayload {
  title: string;
  message: string;
  referenceId?: string;
  type?: string;
}

export enum PushSendOutcome {
  SENT = 'SENT',
  // El endpoint/token ya no existe (404/410 en Web Push, `registration-token-not-registered` en
  // FCM) — la suscripción debe desactivarse en vez de reintentarse.
  GONE = 'GONE',
  FAILED = 'FAILED',
}

export interface IPushSendResult {
  outcome: PushSendOutcome;
  error?: string;
}
