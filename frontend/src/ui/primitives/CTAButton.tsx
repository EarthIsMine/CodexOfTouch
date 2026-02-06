"use client";

import styled from "@emotion/styled";
import type { ButtonHTMLAttributes } from "react";

export type CTAVariant = "brand" | "secondary";

export type CTAButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: CTAVariant;
  children: React.ReactNode;
};

export default function CTAButton({
  variant,
  children,
  ...props
}: CTAButtonProps) {
  return (
    <Button $variant={variant} {...props}>
      {children}
    </Button>
  );
}

const Button = styled.button<{ $variant: CTAVariant }>`
  height: 64px;
  width: 100%;
  border-radius: 18px;
  position: relative;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: var(--font-size-subtitle);
  font-weight: 800;
  letter-spacing: var(--letter-spacing-subtitle);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);

  color: rgba(255, 255, 255, 0.96);

  /* === Liquid glass body === */
  background: ${({ $variant }) =>
    $variant === "brand"
      ? `
        linear-gradient(
          160deg,
          rgba(124, 111, 246, 0.28),
          rgba(124, 111, 246, 0.12) 45%,
          rgba(124, 111, 246, 0.06)
        ),
        linear-gradient(
          120deg,
          rgba(255, 255, 255, 0.35),
          rgba(255, 255, 255, 0.08) 55%
        )
      `
      : `
        linear-gradient(
          160deg,
          rgba(52, 211, 153, 0.28),
          rgba(52, 211, 153, 0.12) 45%,
          rgba(52, 211, 153, 0.06)
        ),
        linear-gradient(
          120deg,
          rgba(255, 255, 255, 0.35),
          rgba(255, 255, 255, 0.08) 55%
        )
      `};

  border: 1px solid rgba(255, 255, 255, 0.32);

  backdrop-filter: blur(28px) saturate(1.45);
  -webkit-backdrop-filter: blur(28px) saturate(1.45);

  /* === Glass thickness & glow === */
  box-shadow: ${({ $variant }) =>
    $variant === "brand"
      ? `
        inset 0 1px 0 rgba(255, 255, 255, 0.55),
        inset 0 -22px 36px rgba(124, 111, 246, 0.22),
        inset 0 12px 18px rgba(255, 255, 255, 0.06),
        0 16px 38px rgba(16, 14, 40, 0.45),
        0 0 28px rgba(124, 111, 246, 0.38)
      `
      : `
        inset 0 1px 0 rgba(255, 255, 255, 0.55),
        inset 0 -22px 36px rgba(52, 211, 153, 0.22),
        inset 0 12px 18px rgba(255, 255, 255, 0.06),
        0 16px 38px rgba(10, 26, 22, 0.45),
        0 0 28px rgba(52, 211, 153, 0.38)
      `};

  /* === Static liquid highlight === */
  &::before {
    content: "";
    position: absolute;
    inset: -60% -30%;
    background: radial-gradient(
      40% 35% at 30% 30%,
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0) 70%
    );
    opacity: 0.8;
    transform: translateY(-22%) rotate(8deg);
    pointer-events: none;
  }

  /* === Inner refraction layer === */
  &::after {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 16px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.28),
      rgba(255, 255, 255, 0.04) 40%,
      rgba(255, 255, 255, 0.12) 60%,
      rgba(255, 255, 255, 0.02)
    );
    opacity: 0.6;
    mix-blend-mode: screen;
    pointer-events: none;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  transition:
    transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 140ms ease,
    box-shadow 140ms ease;

  &:active {
    transform: scale(0.985);
    filter: brightness(1.03) saturate(1.04);
    box-shadow: ${({ $variant }) =>
      $variant === "brand"
        ? `
          inset 0 2px 0 rgba(255, 255, 255, 0.45),
          inset 0 -18px 28px rgba(124, 111, 246, 0.28),
          0 10px 24px rgba(16, 14, 40, 0.5)
        `
        : `
          inset 0 2px 0 rgba(255, 255, 255, 0.45),
          inset 0 -18px 28px rgba(52, 211, 153, 0.28),
          0 10px 24px rgba(10, 26, 22, 0.5)
        `};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    filter: saturate(0.7);
    box-shadow: none;
  }
`;
