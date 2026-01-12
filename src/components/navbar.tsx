"use client";

import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">
          <span className="text-2xl">⚡</span>
          초광속 테크뉴스
        </a>
      </div>
      <div className="flex-none">
        <ThemeToggle />
      </div>
    </div>
  );
}
