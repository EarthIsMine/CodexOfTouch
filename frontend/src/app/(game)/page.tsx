"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";
import { useState } from "react";
import CharacterStatusCard from "@/ui/cards/CharacterStatusCard";
import InfoStatCard from "@/ui/cards/InfoStatCard";

export default function HomePage() {
  const t = useTranslations("home");
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const cooldownSec = 0;
  const softCurrency = 12;
  const poolAmount = 238;
  const jackpotRemainingSec = 142;

  const formattedPool = poolAmount.toLocaleString();
  const formattedJackpotTime = formatMmSs(jackpotRemainingSec);

  const heroCardText = {
    title: t("card.activeTitle"),
    characterName: t("card.characterName"),
    topActionLabel: t("cta.dailyCheckIn"),
    jackpotPoolLabel: t("card.jackpotPool"),
    jackpotPoolValue: formattedPool,
    primaryStatLabel: t("card.jackpot"),
    primaryStatValue: formattedJackpotTime,
    secondaryStatLabel: t("card.pool"),
    secondaryStatValue: formattedPool,
    hint: t("card.hint"),
  };

  const infoRows = [
    { label: t("card.softCurrency"), value: softCurrency.toLocaleString() },
    {
      label: t("card.cooldown"),
      value:
        cooldownSec > 0
          ? t("card.cooldownValue", { seconds: cooldownSec })
          : t("card.ready"),
    },
  ];
  return (
    <Main $expanded={isInfoExpanded}>
      <CharacterStatusCard {...heroCardText} />
      <InfoStatCard
        rows={infoRows}
        description={t("card.checkinSub")}
        footnote={t("card.cooldownSub")}
        expanded={isInfoExpanded}
        onToggle={() => setIsInfoExpanded((prev) => !prev)}
      />
    </Main>
  );
}

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const Main = styled.main<{ $expanded: boolean }>`
  flex: 1;
  min-height: 0;
  padding: 0 14px;
  display: grid;
  grid-template-rows: ${({ $expanded }) =>
    $expanded
      ? "minmax(0, 1.95fr) minmax(0, 1.4fr)"
      : "minmax(0, 2.75fr) minmax(0, 0.58fr)"};
  gap: 10px;
  overflow: hidden;
  transition: grid-template-rows 240ms ease;
`;
