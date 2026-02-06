"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";
import CTAButton from "@/ui/primitives/CTAButton";
import AppHeader from "@/ui/layout/AppHeader";

type HeaderSectionProps = {
  isVerified: boolean;
};

type BottomCTASectionProps = {
  isVerified: boolean;
  cooldownSec: number;
  isPetDisabled: boolean;
};

export function HeaderSection({ isVerified }: HeaderSectionProps) {
  const t = useTranslations("home");
  return (
    <AppHeader
      appName={t("header.appName")}
      statusText={isVerified ? t("header.verified") : t("header.verifyRequired")}
      statusTone={isVerified ? "ok" : "warn"}
    />
  );
}

export function BottomCTASection({
  isVerified,
  cooldownSec,
  isPetDisabled,
}: BottomCTASectionProps) {
  const t = useTranslations("home");

  return (
    <BottomCTA>
      <PrimaryAction>
        <CTAButton variant="brand" disabled={isPetDisabled}>
          {isVerified
            ? cooldownSec > 0
              ? t("cta.cooldown", { seconds: cooldownSec })
              : t("cta.pet")
            : t("cta.verify")}
        </CTAButton>
        <ActionCaption>{t("cta.petCost", { amount: 1 })}</ActionCaption>
      </PrimaryAction>
    </BottomCTA>
  );
}

const BottomCTA = styled.section`
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PrimaryAction = styled.div`
  display: grid;
  gap: 8px;
`;

const ActionCaption = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: rgba(219, 244, 255, 0.96);
  text-align: center;
`;
