"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import HomeBackground from "@/ui/pages/home/HomeBackground";
import { BottomCTASection, HeaderSection } from "@/ui/pages/home/HomeSections";

export default function GameLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("home");

  const isVerified = true;
  const cooldownSec = 0;
  const isPetDisabled = !isVerified || cooldownSec > 0;

  return (
    <HomeBackground>
      <Container className="app-container">
        <HeaderSection isVerified={isVerified} />
        <Content>{children}</Content>
        <CTAZone>
          <Dock>
            <DockItem href="/" data-active={pathname === "/"}>
              {t("dock.home")}
            </DockItem>
            <DockItem href="/codex" data-active={pathname === "/codex"}>
              {t("nav.codex")}
            </DockItem>
            <DockItem href="/rules" data-active={pathname === "/rules"}>
              {t("nav.rules")}
            </DockItem>
            <DockItem href="/market" data-active={pathname === "/market"}>
              {t("dock.market")}
            </DockItem>
          </Dock>
          <BottomCTASection
            isVerified={isVerified}
            cooldownSec={cooldownSec}
            isPetDisabled={isPetDisabled}
          />
        </CTAZone>
      </Container>
    </HomeBackground>
  );
}

const Container = styled.div`
  position: relative;
  z-index: 1;
  height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CTAZone = styled.div`
  flex-shrink: 0;
  padding: 12px 14px calc(18px + env(safe-area-inset-bottom));
  background: linear-gradient(
    180deg,
    rgba(2, 6, 16, 0) 0%,
    rgba(2, 9, 22, 0.86) 26%,
    rgba(2, 10, 24, 0.96) 100%
  );
  backdrop-filter: blur(8px);
  display: grid;
  gap: 10px;
`;

const Dock = styled.nav`
  border-radius: 14px;
  border: 1px solid rgba(98, 205, 255, 0.2);
  background: rgba(4, 16, 36, 0.84);
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
`;

const DockItem = styled(Link)`
  height: 34px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(188, 226, 247, 0.8);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;

  &[data-active="true"] {
    border-color: rgba(105, 220, 255, 0.34);
    color: rgba(226, 247, 255, 0.95);
    background: rgba(25, 80, 124, 0.46);
    box-shadow: inset 0 0 14px rgba(90, 198, 255, 0.2);
  }
`;
