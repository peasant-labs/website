"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? "[x]" : "[=]"}
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[var(--bg-deep)]/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`
          lg:hidden fixed top-0 left-0 z-40 h-full w-[280px]
          bg-[var(--bg-surface)] border-r border-[var(--border-default)]
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          pt-14 px-4
        `}
      >
        <div onClick={() => setOpen(false)}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
