"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ContactForm = dynamic(
  () =>
    import("@/components/main/contact-form").then(
      (module) => module.ContactForm,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="mt-10 min-h-[32rem] text-sm text-gray-400" role="status">
        Preparing contact form...
      </p>
    ),
  },
);

export const DeferredContactForm = ({ recipient }: { recipient: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <ContactForm recipient={recipient} />
      ) : (
        <p className="mt-10 min-h-[32rem] text-sm text-gray-400" role="status">
          Contact form loads as this section approaches the viewport.
        </p>
      )}
    </div>
  );
};
