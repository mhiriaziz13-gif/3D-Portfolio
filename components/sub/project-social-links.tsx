import { FaGithub, FaLinkedin } from "react-icons/fa";

type ProjectSocialLinksProps = {
  githubUrl?: string;
  linkedinUrl?: string;
  projectTitle: string;
  className?: string;
};

export const ProjectSocialLinks = ({
  githubUrl,
  linkedinUrl,
  projectTitle,
  className = "",
}: ProjectSocialLinksProps) => {
  if (!githubUrl && !linkedinUrl) return null;

  return (
    <div className={`z-20 flex items-center gap-3 ${className}`}>
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${projectTitle} on GitHub`}
          title="View on GitHub"
          className="text-2xl text-gray-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          <FaGithub aria-hidden="true" />
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${projectTitle} on LinkedIn`}
          title="View on LinkedIn"
          className="text-2xl text-gray-300 transition hover:text-[#0A66C2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          <FaLinkedin aria-hidden="true" />
        </a>
      )}
    </div>
  );
};
