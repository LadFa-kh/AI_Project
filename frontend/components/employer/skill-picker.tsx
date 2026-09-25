"use client";

// Required-skills input for the job form. The backend rejects any skill that
// isn't in the O*NET taxonomy ("พบ skill ที่ไม่อยู่ในระบบ: …"), so instead of
// free text the employer picks from GET /skills/search (native <datalist>
// suggestions) and each pick becomes a removable chip. The value stays the
// comma-separated string the API expects.

import { useEffect, useMemo, useState } from "react";
import { searchSkills } from "@/lib/skill-service";
import styles from "@/components/admin/admin-dashboard.module.css";

function splitSkills(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function SkillPicker({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [all, setAll] = useState<string[] | null>(null);
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const selected = useMemo(() => splitSkills(value), [value]);

  useEffect(() => {
    let cancelled = false;
    searchSkills()
      .then((list) => {
        if (!cancelled) setAll(list);
      })
      .catch(() => {
        if (!cancelled) setAll([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Case-insensitive lookup → canonical spelling from the taxonomy.
  const byLower = useMemo(() => new Map((all ?? []).map((s) => [s.toLowerCase(), s])), [all]);

  function add(raw: string) {
    const name = raw.trim();
    if (!name) return;
    const canonical = byLower.get(name.toLowerCase());
    if (all && all.length > 0 && !canonical) {
      setHint(`ไม่พบ "${name}" ในระบบ — เลือกจากรายการที่แนะนำ`);
      return;
    }
    const skill = canonical ?? name;
    if (!selected.includes(skill)) onChange([...selected, skill].join(","));
    setText("");
    setHint("");
  }

  function remove(skill: string) {
    onChange(selected.filter((s) => s !== skill).join(","));
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className={styles.skillWrap} style={{ maxWidth: "none", marginBottom: 8 }}>
          {selected.map((s) => (
            <span key={s} className={styles.skillChip}>
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                aria-label={`ลบ ${s}`}
                style={{ marginLeft: 6, background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        className={styles.formInput}
        list={`${id}-options`}
        value={text}
        placeholder={all === null ? "กำลังโหลดรายการทักษะ..." : "พิมพ์เพื่อค้นหา แล้วกด Enter หรือเลือกจากรายการ"}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          setHint("");
          // Picking a <datalist> option fires onChange with the exact option text.
          if (byLower.get(v.trim().toLowerCase()) === v.trim()) add(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          }
        }}
        autoComplete="off"
      />
      <datalist id={`${id}-options`}>
        {(all ?? [])
          .filter((s) => !selected.includes(s))
          .filter((s) => (text.trim().length >= 1 ? s.toLowerCase().includes(text.trim().toLowerCase()) : true))
          .slice(0, 50)
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
      {hint && (
        <p className={styles.formError} role="alert" style={{ marginTop: 6 }}>
          {hint}
        </p>
      )}
    </div>
  );
}
