/// <reference types="vite/client" />

// ── Google Analytics 4 global types ─────────────────────────────────────────
type GtagCommand = "config" | "event" | "js" | "set" | "get" | "consent";

interface GtagConfigParams {
  send_page_view?: boolean;
  anonymize_ip?: boolean;
  page_path?: string;
  page_title?: string;
  page_location?: string;
  send_to?: string;
  [key: string]: unknown;
}

declare function gtag(command: "js", date: Date): void;
declare function gtag(command: "config", targetId: string, params?: GtagConfigParams): void;
declare function gtag(command: "event", eventName: string, params?: Record<string, unknown>): void;
declare function gtag(command: GtagCommand, ...args: unknown[]): void;

interface Window {
  dataLayer: unknown[];
  gtag: typeof gtag;
}
