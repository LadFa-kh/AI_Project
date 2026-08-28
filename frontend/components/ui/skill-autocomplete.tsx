"use client";

import { useEffect, useRef, useState } from "react";
import { searchSkills } from "@/lib/skill-service";
import styles from "./skill-autocomplete.module.css";
import fieldStyles from "@/components/resume/resume-upload.module.css";

// Click-to-open select backed by GET /skills/search. Loads the full skill
// list (all ~1358 entries — no cap) the first time it's opened, then
// filters client-side as the user types in the in-menu search box.

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

// Menu max-height budget (px) when there's enough room — kept in sync with
// the CSS var of the same value in skill-autocomplete.module.css.
const MENU_MAX_HEIGHT = 240;

export function SkillAutocomplete({ id, value, onChange, placeholder, disabled }: Props) {
  const [options, setOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filterText, setFilterText] = useState("");
  // "down" (default) or "up" — flipped when there isn't enough room below
  // the trigger to fit the menu without running past the viewport edge
  // (which, on a maximized browser window, reads as the dropdown getting
  // clipped by/overlapping the OS taskbar).
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  // Client-side filter over the already-loaded list — no re-fetch per
  // keystroke since the full list is loaded once when the menu opens.
  const filteredOptions =
    filterText.trim().length === 0
      ? options
      : options.filter((option) => option.toLowerCase().includes(filterText.trim().toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadOptions() {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setIsLoading(true);
    setLoadError(false);
    searchSkills()
      .then((result) => setOptions(result))
      .catch(() => {
        setLoadError(true);
        hasLoadedRef.current = false; // allow retry on next open
      })
      .finally(() => setIsLoading(false));
  }

  function toggleOpen() {
    if (disabled) return;
    setIsOpen((open) => {
      const next = !open;
      if (next) {
        // Measure space below the trigger vs. above it — flip the menu
        // upward when there isn't enough room below to fit it without
        // running off the bottom of the viewport.
        const rect = wrapRef.current?.getBoundingClientRect();
        if (rect) {
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          setPlacement(spaceBelow < MENU_MAX_HEIGHT + 16 && spaceAbove > spaceBelow ? "up" : "down");
        }
        loadOptions();
        // Focus the in-menu search box once it mounts.
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else {
        setFilterText("");
      }
      return next;
    });
  }

  function selectOption(option: string) {
    onChange(option);
    setIsOpen(false);
    setActiveIndex(-1);
    setFilterText("");
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) toggleOpen();
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filteredOptions.length > 0) setActiveIndex((i) => (i + 1) % filteredOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredOptions.length > 0)
        setActiveIndex((i) => (i - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        selectOption(filteredOptions[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        className={`${fieldStyles.textInput} ${styles.selectTrigger}`}
      >
        <span className={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden="true"
          className={styles.chevron}
          data-open={isOpen}
        >
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </button>
      {isOpen && (
        <div className={styles.menu} data-placement={placement}>
          <input
            ref={searchInputRef}
            type="text"
            role="searchbox"
            aria-controls={`${id}-listbox`}
            autoComplete="off"
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="พิมพ์เพื่อค้นหา…"
            className={styles.searchInput}
          />
          <div className={styles.optionList} role="listbox" id={`${id}-listbox`}>
            {isLoading ? (
              <p className={styles.emptyState}>กำลังโหลดรายการทักษะ…</p>
            ) : loadError ? (
              <p className={styles.emptyState}>โหลดรายการไม่สำเร็จ กรุณาลองใหม่</p>
            ) : filteredOptions.length === 0 ? (
              <p className={styles.emptyState}>ไม่พบทักษะที่ตรงกัน</p>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  data-active={index === activeIndex}
                  className={styles.option}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(option);
                  }}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
