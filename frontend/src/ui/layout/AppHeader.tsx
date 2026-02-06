"use client";

import styled from "@emotion/styled";
import LanguageButton from "@/ui/primitives/LanguageButton";

type AppHeaderProps = {
  appName: string;
  statusText: string;
  statusTone: "ok" | "warn";
};

export default function AppHeader({
  appName,
  statusText,
  statusTone,
}: AppHeaderProps) {
  return (
    <Header>
      <Brand>
        <BrandDot />
        <BrandText>{appName}</BrandText>
      </Brand>

      <HeaderRight>
        <StatusPill data-tone={statusTone}>{statusText}</StatusPill>
        <LanguageButton />
      </HeaderRight>
    </Header>
  );
}

const Header = styled.header`
  padding: 0 var(--space-4) var(--space-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const BrandDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--color-brand-500);
  box-shadow: 0 0 10px rgba(124, 111, 246, 0.5);
`;

const BrandText = styled.div`
  font-family: var(--font-heading);
  letter-spacing: var(--letter-spacing-heading);
  font-size: 15px;
  font-weight: 800;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const StatusPill = styled.div`
  height: 30px;
  padding: 0 var(--space-3);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;

  font-size: 12px;
  letter-spacing: var(--letter-spacing-body);
  color: rgba(255, 255, 255, 0.9);

  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);

  &[data-tone="ok"] {
    box-shadow: 0 0 14px rgba(52, 211, 153, 0.15);
  }

  &[data-tone="warn"] {
    box-shadow: 0 0 14px rgba(251, 191, 36, 0.15);
  }
`;
