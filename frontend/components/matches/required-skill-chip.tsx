import nocturne from "@/components/ui/nocturne.module.css";

type RequiredSkillChipProps = {
  skill: string;
  isMatch: boolean;
};

/** Skill chip indicating whether it matches the student's assessed level or is a gap.
 *  Conveyed by icon + text label as well as color, not color alone. */
export function RequiredSkillChip({ skill, isMatch }: RequiredSkillChipProps) {
  if (isMatch) {
    return (
      <span className={nocturne.chipSkillMatch}>
        <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
        </svg>
        {skill}
        <span className="sr-only"> (matches your skills)</span>
      </span>
    );
  }

  return (
    <span className={nocturne.chipSkillGap}>
      <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
      </svg>
      {skill}
      <span className="sr-only"> (skill gap)</span>
    </span>
  );
}
