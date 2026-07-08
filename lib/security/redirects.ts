export const safeRedirect = (value: string | null | undefined, fallback = "/admin") => {
  if (!value) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return fallback;
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
      return fallback;
    }

    return decoded;
  } catch {
    return fallback;
  }
};