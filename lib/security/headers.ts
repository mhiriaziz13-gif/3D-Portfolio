export const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export const jsonHeaders = {
  "Content-Type": "application/json",
  ...noStoreHeaders,
} as const;