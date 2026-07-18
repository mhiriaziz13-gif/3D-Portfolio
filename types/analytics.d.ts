export {};

type ConsentState = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown> | IArguments>;
    analyticsCollectionEnabled?: boolean;
    gtag?: (
      command: "consent",
      action: "default" | "update",
      parameters: {
        analytics_storage: ConsentState;
        ad_storage: ConsentState;
        ad_user_data: ConsentState;
        ad_personalization: ConsentState;
        functionality_storage?: ConsentState;
        security_storage?: ConsentState;
        wait_for_update?: number;
      },
    ) => void;
  }
}
