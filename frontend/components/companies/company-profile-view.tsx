"use client";

// Public company profile (API_CHANGES.md §5.4 B4). Reached from the company
// name on internship match cards / the job detail page. Page chrome, card,
// headings and buttons reuse match-detail.module.css so it looks like the
// job detail page it's linked from; company-only bits live in
// company-profile.module.css.

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getCompanyById, getCompanyJobs, type Company } from "@/lib/company-service";
import type { Workplace } from "@/lib/workplace-service";
import { RequiredSkillChip } from "@/components/matches/required-skill-chip";
import detailStyles from "@/components/matches/match-detail.module.css";
import styles from "./company-profile.module.css";

type Status = "loading" | "not-found" | "error" | "success";

// Only render user-supplied URLs as links when they're http(s) — never
// javascript:/data: etc. A bare domain ("example.co.th") gets https://.
function safeWebsite(raw: string | null): string | null {
  if (!raw) return null;
  const value = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function CompanyLogo({ company }: { company: Company }) {
  const [broken, setBroken] = useState(false);
  if (company.logoUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external logo host, not in next/image remotePatterns
      <img src={company.logoUrl} alt="" className={styles.logo} onError={() => setBroken(true)} />
    );
  }
  return (
    <span className={styles.logoFallback} aria-hidden="true">
      {company.nameTh.trim().charAt(0) || "?"}
    </span>
  );
}

export function CompanyProfileView({ companyId }: { companyId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Workplace[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCompanyById(companyId), getCompanyJobs(companyId).catch(() => [] as Workplace[])])
      .then(([companyData, jobData]) => {
        if (cancelled) return;
        setCompany(companyData);
        setJobs(jobData);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 404 = unknown id or company SUSPENDED (TESTING_FLOWS.md)
        setStatus(err instanceof ApiError && err.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const website = safeWebsite(company?.website ?? null);
  const location = [company?.address, company?.province].filter(Boolean).join(" ");

  return (
    <div className={detailStyles.page}>
      <div className={detailStyles.ambient} aria-hidden="true">
        <div className={`${detailStyles.blob} ${detailStyles.blobOne}`} />
        <div className={`${detailStyles.blob} ${detailStyles.blobTwo}`} />
      </div>

      <main className={detailStyles.main}>
        <Link href="/internship-matches" className={`${detailStyles.backLink} ${detailStyles.animateIn} ${detailStyles.delay1}`}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
          </svg>
          กลับสู่รายการตำแหน่งฝึกงาน
        </Link>

        {status === "loading" && (
          <div className={`${detailStyles.detailCard} ${detailStyles.animateIn} ${detailStyles.delay2}`} aria-hidden="true">
            <div className={detailStyles.skeletonLine} style={{ width: "55%", height: 22 }} />
            <div className={detailStyles.skeletonLine} style={{ width: "30%" }} />
            <div className={detailStyles.skeletonLine} style={{ width: "100%" }} />
            <div className={detailStyles.skeletonLine} style={{ width: "85%" }} />
          </div>
        )}

        {(status === "not-found" || status === "error") && (
          <div className={`${detailStyles.detailCard} ${detailStyles.animateIn} ${detailStyles.delay2}`}>
            <p className={detailStyles.formError} role="alert">
              {status === "not-found"
                ? "ไม่พบข้อมูลบริษัทนี้ หรือบริษัทถูกระงับการแสดงผลชั่วคราว"
                : "โหลดข้อมูลบริษัทไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}
            </p>
            <Link href="/internship-matches" className={detailStyles.ghostBtn}>
              กลับสู่รายการ
            </Link>
          </div>
        )}

        {status === "success" && company && (
          <div className={detailStyles.detailCard}>
            <div className={`${detailStyles.headerRow} ${detailStyles.animateIn} ${detailStyles.delay2}`}>
              <div className={styles.identity}>
                <CompanyLogo company={company} />
                <div className={detailStyles.headerTitleBlock}>
                  <h1 className={detailStyles.titleText}>{company.nameTh}</h1>
                  {company.nameEn && <p className={styles.subName}>{company.nameEn}</p>}
                  {company.industry && <span className={detailStyles.jobTypeBadge}>{company.industry}</span>}
                </div>
              </div>
            </div>

            {company.description && (
              <div className={`${detailStyles.animateIn} ${detailStyles.delay3}`}>
                <h2 className={detailStyles.sectionHeading}>เกี่ยวกับบริษัท</h2>
                <p className={detailStyles.bodyText} style={{ whiteSpace: "pre-line" }}>
                  {company.description}
                </p>
              </div>
            )}

            {(location || website || company.email || company.phone) && (
              <div className={`${detailStyles.animateIn} ${detailStyles.delay3}`}>
                <h2 className={detailStyles.sectionHeading}>ข้อมูลติดต่อ</h2>
                <dl className={styles.facts}>
                  {location && (
                    <div className={styles.fact}>
                      <dt>ที่ตั้ง</dt>
                      <dd>{location}</dd>
                    </div>
                  )}
                  {website && (
                    <div className={styles.fact}>
                      <dt>เว็บไซต์</dt>
                      <dd>
                        <a href={website} target="_blank" rel="noopener noreferrer" className={styles.factLink}>
                          {company.website}
                        </a>
                      </dd>
                    </div>
                  )}
                  {company.email && (
                    <div className={styles.fact}>
                      <dt>อีเมล</dt>
                      <dd>
                        <a href={`mailto:${company.email}`} className={styles.factLink}>{company.email}</a>
                      </dd>
                    </div>
                  )}
                  {company.phone && (
                    <div className={styles.fact}>
                      <dt>โทรศัพท์</dt>
                      <dd>
                        <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`} className={styles.factLink}>
                          {company.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className={`${detailStyles.animateIn} ${detailStyles.delay4}`}>
              <h2 className={detailStyles.sectionHeading}>ตำแหน่งที่เปิดรับ ({jobs.length})</h2>
              {jobs.length === 0 ? (
                <p className={detailStyles.bodyText}>ตอนนี้บริษัทนี้ยังไม่มีตำแหน่งที่เปิดรับ</p>
              ) : (
                <ul className={styles.jobList}>
                  {jobs.map((job) => (
                    <li key={job.id} className={styles.jobRow}>
                      <div className={styles.jobInfo}>
                        <h3 className={styles.jobTitle}>{job.positionName}</h3>
                        {job.jobType && <span className={detailStyles.jobTypeBadge}>{job.jobType}</span>}
                        {job.requiredSkills?.length > 0 && (
                          <div className={detailStyles.skillChipRow}>
                            {job.requiredSkills.map((skill) => (
                              <RequiredSkillChip key={skill} skill={skill} isMatch="neutral" />
                            ))}
                          </div>
                        )}
                      </div>
                      <Link href={`/internship-matches/${job.id}`} className={`${detailStyles.ghostBtn} ${styles.jobLink}`}>
                        ดูรายละเอียด
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
