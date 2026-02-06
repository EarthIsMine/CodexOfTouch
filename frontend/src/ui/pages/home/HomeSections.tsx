"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";
import CTAButton from "@/ui/primitives/CTAButton";
import AppHeader from "@/ui/layout/AppHeader";
import WorldIdVerifyButton from "@/ui/primitives/WorldIdVerifyButton";

type HeaderSectionProps = {
  isVerified: boolean;
};

type BottomCTASectionProps = {
  isVerified: boolean;
  cooldownSec: number;
  isPetDisabled: boolean;
  onPetAction?: () => void;
  petPending?: boolean;
  onVerificationSuccess?: () => void;
  onVerificationError?: (message: string) => void;
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
  onPetAction,
  petPending = false,
  onVerificationSuccess,
  onVerificationError,
}: BottomCTASectionProps) {
  const t = useTranslations("home");

  return (
    <BottomCTA>
      <PrimaryAction>
        {isVerified ? (
          <CTAButton
            variant="brand"
            disabled={isPetDisabled || petPending}
            onClick={onPetAction}
          >
            {petPending
              ? t("cta.petting")
              : cooldownSec > 0
                ? t("cta.cooldown", { seconds: cooldownSec })
                : t("cta.pet")}
          </CTAButton>
        ) : (
          <WorldIdVerifyButton
            label={t("cta.verify")}
            verifyingLabel={t("cta.verify")}
            disabled={petPending}
            onVerified={() => onVerificationSuccess?.()}
            onError={(message) => onVerificationError?.(message)}
            missingConfigMessage={t("cta.verifyMissingConfig")}
          />
        )}
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
