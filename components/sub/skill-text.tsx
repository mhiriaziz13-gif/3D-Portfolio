import { SparklesIcon } from "@heroicons/react/24/solid";

export const SkillText = () => {
  return (
    <div className="w-full h-auto flex flex-col items-center justify-center">
      <div className="Welcome-box py-[8px] px-[7px] border border-[#7042f88b] opacity-[0.9]">
        <SparklesIcon className="text-[#b49bff] mr-[10px] h-5 w-5" />
        <p className="Welcome-text text-[13px]">Skills and focus areas</p>
      </div>

      <h2
        className="text-[30px] text-white font-medium mt-[10px] text-center mb-[15px]"
      >
        Data + Business + Marketing + Automation
      </h2>

      <p className="cursive text-[20px] text-gray-200 mb-10 mt-[10px] text-center">
        A practical stack for analytics, reporting, growth and reliable operations.
      </p>
    </div>
  );
};
