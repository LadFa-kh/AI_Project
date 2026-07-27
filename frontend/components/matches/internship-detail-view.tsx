"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MatchScorePill } from "./match-score-pill";
import { RequiredSkillChip } from "./required-skill-chip";
import { MatchDetailFact } from "./match-detail-fact";
import {
  getMockInternshipDetail,
  type InternshipDetail,
} from "@/lib/internship-detail-types";
import nocturne from "@/components/ui/nocturne.module.css";
import styles from "./match-detail.module.css";

type Status = "loading" | "not-found" | "error" | "success";

const LOCATION_ICON_PATH =
  "M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,120a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z";
const TYPE_ICON_PATH =
  "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm4-136v56a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Z";
const DURATION_ICON_PATH =
  "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm40,112H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h32a8,8,0,0,1,0,16Z";

export function InternshipDetailView({ internshipId }: { internshipId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<InternshipDetail | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend — GET request for a single internship (internshipId from route param).
      // Base shape matches the matches list contract per PROJECT_CONTEXT.md:
      // { internshipId, title, company, matchScore, requiredSkills }
      // Additional detail fields used here (description, location, workType, duration, matchedSkills,
      // externalUrl) are NOT yet in the documented contract — backend TODO: extend the detail
      // endpoint response to include them, or confirm which are sourced elsewhere.
      await new Promise((resolve) => setTimeout(resolve, 800));
      const found = getMockInternshipDetail(internshipId);
      if (!found) {
        setStatus("not-found");
        return;
      }
      setDetail(found);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [internshipId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={nocturne.wideShell}>
      <div className={nocturne.narrowContainer}>
        <Link href="/internship-matches" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
          </svg>
          Back to matches
        </Link>

        {status === "loading" && (
          <div className={styles.detailCard} aria-hidden="true">
            <div className={styles.skeletonLine} style={{ width: "60%", height: 22 }} />
            <div className={styles.skeletonLine} style={{ width: "35%" }} />
            <div className={styles.skeletonLine} style={{ width: "100%" }} />
            <div className={styles.skeletonLine} style={{ width: "90%" }} />
            <div className={styles.skeletonLine} style={{ width: "40%" }} />
          </div>
        )}

        {status === "not-found" && (
          <div className={styles.detailCard}>
            <p className={nocturne.formError} role="alert">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
              </svg>
              This internship is no longer available.
            </p>
            <Link href="/internship-matches" className={nocturne.ghostBtn}>
              Back to matches
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className={styles.detailCard}>
            <p className={nocturne.formError} role="alert">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
              </svg>
              We couldn&apos;t load this internship. Please try again.
            </p>
            <button type="button" onClick={load} className={nocturne.submitBtn}>
              Retry
            </button>
            <Link href="/internship-matches" className={nocturne.ghostBtn}>
              Back to matches
            </Link>
          </div>
        )}

        {status === "success" && detail && (
          <div className={styles.detailCard}>
            <div className={styles.headerBlock}>
              <div className={styles.headerTitleBlock}>
                <h1 className={styles.titleText}>{detail.title}</h1>
                <p className={styles.companyText}>{detail.company}</p>
              </div>
              <MatchScorePill score={detail.matchScore} />
            </div>

            <div>
              <h2 className={styles.sectionHeading}>Required skills</h2>
              <div className={styles.skillChipRow}>
                {detail.requiredSkills.map((skill) => (
                  <RequiredSkillChip
                    key={skill}
                    skill={skill}
                    isMatch={detail.matchedSkills.includes(skill)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className={styles.sectionHeading}>About this role</h2>
              <p className={styles.bodyText}>{detail.description}</p>
            </div>

            {(detail.location || detail.workType || detail.duration) && (
              <div className={styles.detailsRow}>
                {detail.location && (
                  <MatchDetailFact
                    icon={
                      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                        <path d={LOCATION_ICON_PATH} />
                      </svg>
                    }
                    label="Location"
                    value={detail.location}
                  />
                )}
                {detail.workType && (
                  <MatchDetailFact
                    icon={
                      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                        <path d={TYPE_ICON_PATH} />
                      </svg>
                    }
                    label="Type"
                    value={detail.workType}
                  />
                )}
                {detail.duration && (
                  <MatchDetailFact
                    icon={
                      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                        <path d={DURATION_ICON_PATH} />
                      </svg>
                    }
                    label="Duration"
                    value={detail.duration}
                  />
                )}
              </div>
            )}

            <div className={styles.ctaRow}>
              <a
                href={detail.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={nocturne.submitBtn}
              >
                Learn more
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z" />
                </svg>
              </a>
              <p className={styles.externalNote}>
                This opens the employer&apos;s site in a new tab — applications aren&apos;t submitted through this tool.
              </p>
              <Link href="/internship-matches" className={nocturne.ghostBtn}>
                Back to matches
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
