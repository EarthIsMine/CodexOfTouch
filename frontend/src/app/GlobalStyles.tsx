"use client";

import { Global, css } from "@emotion/react";

export default function GlobalStyles() {
  return (
    <Global
      styles={css`
        /* =========================
           1. CSS Reset (Minimal)
        ========================== */

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;

          /* 🌑 Dark Theme Default */
          background-color: var(--color-neutral-1000);
          color: var(--color-neutral-100);

          font-family: var(--font-body);
        }

        button {
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          font: inherit;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        img,
        video {
          max-width: 100%;
          display: block;
        }

        /* =========================
           2. Font Families
        ========================== */

        :root {
          --font-heading:
            "학교안심 둥근미소", Pretendard, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;

          --font-body:
            Pretendard, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        /* =========================
           3. Typography Scale
        ========================== */

        :root {
          /* Base */
          --font-size-base: 14px;

          /* Headings */
          --font-size-h1: 22px;
          --font-size-h2: 20px;

          /* Others */
          --font-size-subtitle: 16px;
          --font-size-body: 14px;
          --font-size-caption: 12px;

          /* Line Heights */
          --line-height-heading: 1.2;
          --line-height-subtitle: 1.4;
          --line-height-body: 1.5;

          /* Letter Spacing */
          --letter-spacing-heading: 0.005em;
          --letter-spacing-subtitle: -0.005em;
          --letter-spacing-body: -0.015em;
        }

        h1,
        h2 {
          font-family: var(--font-heading);
          line-height: var(--line-height-heading);
          letter-spacing: var(--letter-spacing-heading);
          margin: 0;
          color: var(--color-neutral-100);
        }

        h1 {
          font-size: var(--font-size-h1);
        }

        h2 {
          font-size: var(--font-size-h2);
        }

        p,
        span,
        li,
        input,
        textarea {
          font-family: var(--font-body);
          font-size: var(--font-size-body);
          line-height: var(--line-height-body);
          letter-spacing: var(--letter-spacing-body);
          margin: 0;
          color: var(--color-neutral-200);
        }

        .subtitle {
          font-size: var(--font-size-subtitle);
          line-height: var(--line-height-subtitle);
          letter-spacing: var(--letter-spacing-subtitle);
          color: var(--color-neutral-300);
        }

        .caption {
          font-size: var(--font-size-caption);
          line-height: var(--line-height-body);
          letter-spacing: var(--letter-spacing-body);
          color: var(--color-neutral-400);
        }

        /* =========================
           4. Spacing Scale (4px)
        ========================== */

        :root {
          --space-0: 0px;
          --space-1: 4px;
          --space-2: 8px;
          --space-3: 12px;
          --space-4: 16px;
          --space-5: 20px;
          --space-6: 24px;
          --space-7: 32px;
          --space-8: 40px;
          --space-9: 48px;
          --space-10: 64px;
        }

        /* =========================
           5. Color Palette
        ========================== */

        :root {
          /* Neutral */
          --color-neutral-100: #ffffff;
          --color-neutral-200: #f3f4f6;
          --color-neutral-300: #e5e7eb;
          --color-neutral-400: #d1d5db;
          --color-neutral-500: #9ca3af;
          --color-neutral-600: #6b7280;
          --color-neutral-700: #4b5563;
          --color-neutral-800: #374151;
          --color-neutral-900: #1f2937;
          --color-neutral-1000: #111827;
          --color-neutral-1100: #0b1220;
          --color-neutral-1200: #05080f;
          --color-neutral-1300: #000000;

          /* Brand (Soft Violet) */
          --color-brand-100: #f3f1ff;
          --color-brand-200: #e4e0ff;
          --color-brand-300: #cfc8ff;
          --color-brand-400: #afa5ff;
          --color-brand-500: #7c6ff6;
          --color-brand-600: #665ae0;
          --color-brand-700: #5347c2;
          --color-brand-800: #3f369a;
          --color-brand-900: #2c2670;
          --color-brand-1000: #1a1747;

          /* Secondary (Mint) */
          --color-secondary-100: #ecfef6;
          --color-secondary-200: #d1fae5;
          --color-secondary-300: #a7f3d0;
          --color-secondary-400: #6ee7b7;
          --color-secondary-500: #34d399;
          --color-secondary-600: #10b981;
          --color-secondary-700: #059669;
          --color-secondary-800: #047857;
          --color-secondary-900: #065f46;
          --color-secondary-1000: #064e3b;

          /* System */
          --color-success: #34d399;
          --color-warning: #fbbf24;
          --color-error: #f87171;
          --color-info: #60a5fa;

          /* ✨ Fluorescent Accent (CTA Only) */
          --color-accent-neon: #b7ff3c;
        }

        /* =========================
           6. Layout Base (Mobile First)
        ========================== */

        #root {
          min-height: 100%;
        }

        .app-container {
          max-width: 480px;
          margin: 0 auto;
          padding: var(--space-4);
        }

        /* =========================
           7. Accessibility
        ========================== */

        :focus-visible {
          outline: 2px solid var(--color-accent-neon);
          outline-offset: 2px;
        }
      `}
    />
  );
}
