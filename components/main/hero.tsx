import { HeroContent } from "@/components/sub/hero-content";
import type { HeroContentData, ProfileContent } from "@/lib/cms-types";

export const Hero = ({ profile, hero }: { profile?: ProfileContent; hero?: HeroContentData }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute left-0 top-[-260px] -z-20 h-full w-full rotate-180 object-cover opacity-80"
      >
        <source src="/videos/blackhole.webm" type="video/webm" />
      </video>

      <HeroContent profile={profile} hero={hero} />
    </div>
  );
};