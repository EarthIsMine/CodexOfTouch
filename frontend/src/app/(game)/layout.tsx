"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import HomeBackground from "@/ui/pages/home/HomeBackground";
import { BottomCTASection, HeaderSection } from "@/ui/pages/home/HomeSections";
import ToastMessage from "@/ui/primitives/ToastMessage";

export default function GameLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("home");

  const [isVerified, setIsVerified] = useState(false);
  const [activeCharacterId, setActiveCharacterId] = useState(0);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [petPending, setPetPending] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<number | null>(null);
  const isPetDisabled = !isVerified || cooldownSec > 0 || activeCharacterId <= 0;

  useEffect(() => {
    const verified = window.localStorage.getItem("world_id_verified");
    if (verified === "1") {
      setIsVerified(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadActiveCharacter = async () => {
      try {
        const response = await fetch("/api/dev/home-stats", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            characterId: number;
          };
        };

        if (!mounted || !response.ok || !payload.ok || !payload.data) {
          return;
        }

        setActiveCharacterId(payload.data.characterId);
      } catch {
        // Keep fallback id when request fails.
      }
    };

    void loadActiveCharacter();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (cooldownSec <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownSec]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 1800);
  };

  const handlePetAction = async () => {
    if (petPending || isPetDisabled) {
      return;
    }

    setPetPending(true);
    try {
      const response = await fetch("/api/dev/pet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: activeCharacterId,
          skillId: null,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        errorCode?: string;
        error?: string;
        cooldownUntil?: string | null;
        data?: {
          result?: "SUCCESS" | "FAIL";
          cooldownUntil?: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        if (payload.errorCode === "PET_001") {
          showToast(t("cta.petFailedNoBalance"));
          return;
        }

        const cooldownUntil = payload.cooldownUntil;
        if (cooldownUntil) {
          const sec = secondsUntil(cooldownUntil);
          if (sec > 0) {
            setCooldownSec(sec);
          }
        }
        showToast(payload.error || t("cta.petFailed"));
        return;
      }

      if (payload.data.result === "FAIL" && payload.data.cooldownUntil) {
        const sec = secondsUntil(payload.data.cooldownUntil);
        if (sec > 0) {
          setCooldownSec(sec);
        }
      }

      window.dispatchEvent(new CustomEvent("codex:refresh-home-stats"));

      const isSuccess = payload.data.result === "SUCCESS";
      window.dispatchEvent(
        new CustomEvent("codex:pet-result", {
          detail: { result: isSuccess ? "SUCCESS" : "FAIL" },
        }),
      );
      showToast(isSuccess ? t("cta.petSuccess") : t("cta.petFail"));
    } catch {
      showToast(t("cta.petFailed"));
    } finally {
      setPetPending(false);
    }
  };

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    window.localStorage.setItem("world_id_verified", "1");
    showToast(t("cta.verifySuccess"));
    window.dispatchEvent(new CustomEvent("codex:refresh-home-stats"));
  };

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
            onPetAction={handlePetAction}
            petPending={petPending}
            onVerificationSuccess={handleVerificationSuccess}
            onVerificationError={(message) =>
              showToast(message || t("cta.verifyFailed"))
            }
          />
        </CTAZone>
        {toastMessage ? <ToastMessage message={toastMessage} /> : null}
      </Container>
    </HomeBackground>
  );
}

function secondsUntil(isoDate: string) {
  const deadline = new Date(isoDate).getTime();
  if (Number.isNaN(deadline)) {
    return 0;
  }
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
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
