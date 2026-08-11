import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import styles from "@/components/auth/register.module.css";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>

      <div className={styles.contentStack}>
        <div className={styles.backLinkRow}>
          <Link href="/" className={`${styles.backLink} ${styles.animateIn}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to home
          </Link>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.halo} aria-hidden="true" />
          <div className={styles.card}>
            <div className={styles.brand}>
              <div className={`${styles.logoMark} ${styles.animateIn} ${styles.delay1}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2 3 6.5V12c0 5.25 3.6 9.9 9 11 5.4-1.1 9-5.75 9-11V6.5L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 12.2 11 14.7l4.7-5.4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className={styles.headingBlock}>
              <h1 className={`${styles.heading} ${styles.animateIn} ${styles.delay1}`}>
                Create your account
              </h1>
              <p className={`${styles.subheading} ${styles.animateIn} ${styles.delay2}`}>
                Sign up to start your resume analysis and internship matches.
              </p>
            </div>

            <RegisterForm />

            <p className={`${styles.footer} ${styles.animateIn} ${styles.delay5}`}>
              Already have an account?{" "}
              <Link href="/login" className={styles.link}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
