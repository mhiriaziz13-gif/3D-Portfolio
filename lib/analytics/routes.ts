const PRIVATE_ROUTE_PREFIXES = ["/admin", "/auth"] as const;

export const isPublicAnalyticsRoute = (pathname: string) =>
  !PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
