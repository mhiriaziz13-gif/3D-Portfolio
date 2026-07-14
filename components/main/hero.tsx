import { HeroContent } from "@/components/sub/hero-content";
import { DeferredBackgroundVideo } from "@/components/main/deferred-background-video";
import type { HeroContentData, ProfileContent } from "@/lib/cms-types";

export const Hero = ({ profile, hero }: { profile?: ProfileContent; hero?: HeroContentData }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <DeferredBackgroundVideo
        src="/videos/blackhole.webm"
        deferAfterLoadMs={12000}
        rootMargin="0px"
        className="absolute left-0 top-[-260px] -z-20 h-full w-full rotate-180 object-cover opacity-80"
      />

      <HeroContent profile={profile} hero={hero} />
    </div>
  );
};
