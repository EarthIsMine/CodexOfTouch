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
  border-radius: 16px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: var(--font-size-subtitle);
  font-weight: 800;
  letter-spacing: var(--letter-spacing-subtitle);

  color: rgba(255, 255, 255, 0.95);

  background-color: ${({ $variant }) =>
    $variant === "brand"
      ? "var(--color-brand-500)"
      : "var(--color-secondary-500)"};

  border: 1px solid rgba(255, 255, 255, 0.1);

  /* ✨ 절제된 네온 */
  box-shadow: ${({ $variant }) =>
    $variant === "brand"
      ? `
        0 0 6px rgba(124, 111, 246, 0.45),
        0 0 16px rgba(124, 111, 246, 0.3)
      `
      : `
        0 0 6px rgba(52, 211, 153, 0.45),
        0 0 16px rgba(52, 211, 153, 0.3)
      `};

  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;

  &:active {
    transform: scale(0.985);
    filter: brightness(1.02) saturate(1.03);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
`;
