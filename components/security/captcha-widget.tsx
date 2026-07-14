"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const configuredProvider =
  process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER?.trim().toLowerCase() ?? "";
const configuredSiteKey =
  process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY?.trim() ?? "";

type TurnstileWidgetId = string;

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  size?: "normal" | "flexible" | "compact";
  theme?: "light" | "dark" | "auto";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  "unsupported-callback": () => void;
  "response-field": boolean;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove: (widgetId: TurnstileWidgetId) => void;
  execute: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type CaptchaSnapshot = {
  token: string | null;
  ready: boolean;
  error: string | null;
  expired: boolean;
};

export type CaptchaController = {
  reset: () => void;
  execute: () => void;
};

type CaptchaWidgetProps = {
  action: "admin-login" | "password-recovery";
  onChange: (snapshot: CaptchaSnapshot) => void;
  onControllerChange?: (controller: CaptchaController | null) => void;
};

const configurationError =
  configuredProvider !== "turnstile"
    ? "Verification is unavailable. Contact the site administrator."
    : !configuredSiteKey
      ? "Verification is not configured. Contact the site administrator."
      : null;

const initialSnapshot: CaptchaSnapshot = {
  token: null,
  ready: false,
  error: configurationError,
  expired: false,
};

let turnstileScriptPromise: Promise<TurnstileApi> | null = null;

const loadTurnstile = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser."));
  }

  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    const script =
      existing instanceof HTMLScriptElement
        ? existing
        : document.createElement("script");
    const created = !existing;

    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      cleanup();
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      reject(new Error("Turnstile did not initialize."));
    };

    const handleError = () => {
      cleanup();
      if (created) script.remove();
      reject(new Error("Turnstile could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (created) {
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.cfasync = "false";
      script.referrerPolicy = "strict-origin-when-cross-origin";
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
};

export const CaptchaWidget = ({
  action,
  onChange,
  onControllerChange,
}: CaptchaWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<TurnstileApi | null>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const onChangeRef = useRef(onChange);
  const [snapshot, setSnapshot] = useState<CaptchaSnapshot>(initialSnapshot);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const emit = useCallback((next: CaptchaSnapshot) => {
    setSnapshot(next);
    onChangeRef.current(next);
  }, []);

  const reset = useCallback(() => {
    const api = turnstileRef.current;
    const widgetId = widgetIdRef.current;

    if (!api || !widgetId) {
      emit(initialSnapshot);
      return;
    }

    try {
      api.reset(widgetId);
      emit({ token: null, ready: true, error: null, expired: false });
    } catch {
      emit({
        token: null,
        ready: false,
        error: "Verification could not be reset. Refresh and try again.",
        expired: false,
      });
    }
  }, [emit]);

  const execute = useCallback(() => {
    const api = turnstileRef.current;
    const widgetId = widgetIdRef.current;
    if (api && widgetId) api.execute(widgetId);
  }, []);

  const controller = useMemo(
    () => ({ reset, execute }),
    [execute, reset],
  );

  useEffect(() => {
    onControllerChange?.(controller);
    return () => onControllerChange?.(null);
  }, [controller, onControllerChange]);

  useEffect(() => {
    let cancelled = false;

    if (configuredProvider !== "turnstile") {
      onChangeRef.current(initialSnapshot);
      return;
    }

    if (!configuredSiteKey) {
      onChangeRef.current(initialSnapshot);
      return;
    }

    onChangeRef.current(initialSnapshot);

    void loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;

        turnstileRef.current = api;
        emit({ token: null, ready: true, error: null, expired: false });
        const widgetSize =
          containerRef.current.clientWidth < 300 ? "compact" : "flexible";

        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: configuredSiteKey,
          action,
          appearance: "always",
          execution: "render",
          size: widgetSize,
          theme: "dark",
          callback: (token) => {
            if (cancelled) return;
            emit({ token, ready: true, error: null, expired: false });
          },
          "expired-callback": () => {
            if (cancelled) return;
            emit({ token: null, ready: true, error: null, expired: true });
          },
          "timeout-callback": () => {
            if (cancelled) return;
            emit({ token: null, ready: true, error: null, expired: true });
          },
          "error-callback": () => {
            if (cancelled) return;
            emit({
              token: null,
              ready: false,
              error: "Verification failed to load. Refresh and try again.",
              expired: false,
            });
          },
          "unsupported-callback": () => {
            if (cancelled) return;
            emit({
              token: null,
              ready: false,
              error: "This browser cannot complete verification.",
              expired: false,
            });
          },
          "response-field": false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        emit({
          token: null,
          ready: false,
          error: "Verification failed to load. Refresh and try again.",
          expired: false,
        });
      });

    return () => {
      cancelled = true;
      const api = turnstileRef.current;
      const widgetId = widgetIdRef.current;
      if (api && widgetId) api.remove(widgetId);
      widgetIdRef.current = null;
      turnstileRef.current = null;
    };
  }, [action, emit]);

  const status = snapshot.error
    ? snapshot.error
    : snapshot.expired
      ? "Verification expired. Complete it again."
      : snapshot.token
        ? "Verification complete."
        : snapshot.ready
          ? "Complete the verification first."
          : "Loading verification...";

  return (
    <div
      className="flex min-w-0 flex-col gap-2"
      role="group"
      aria-label="Human verification"
    >
      <div
        ref={containerRef}
        className="min-h-[140px] w-full min-w-0 overflow-hidden min-[400px]:min-h-[65px]"
      />
      <p className="min-h-5 text-xs text-cyan-100" aria-live="polite">
        {status}
      </p>
    </div>
  );
};
