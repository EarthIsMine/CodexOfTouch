"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import CharacterStatusCard from "@/ui/cards/CharacterStatusCard";
import InfoStatCard from "@/ui/cards/InfoStatCard";
import ToastMessage from "@/ui/primitives/ToastMessage";

const DAILY_CHECK_IN_REWARD = 20;
const STORAGE_SOFT_CURRENCY = "mockSoftCurrency";
const STORAGE_LAST_CHECKIN = "mockLastCheckInDate";

export default function HomePage() {
  const t = useTranslations("home");
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const cooldownSec = 0;
  const [softCurrency, setSoftCurrency] = useState(
    () => readSoftCurrencyFromStorage() ?? 12,
  );
  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(
    () => readCheckInDateFromStorage(),
  );
  const poolAmount = 238;
  const jackpotRemainingSec = 142;
  const [checkInNotice, setCheckInNotice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<number | null>(null);
  const todayKey = getTodayKey();

  const canDailyCheckIn = lastCheckInDate !== todayKey;

  const handleDailyCheckIn = () => {
    if (!canDailyCheckIn) {
      setCheckInNotice(t("card.checkinAlreadyDone"));
      return;
    }

    const nextCurrency = softCurrency + DAILY_CHECK_IN_REWARD;
    setSoftCurrency(nextCurrency);
    setLastCheckInDate(todayKey);
    const successMessage = t("card.checkinSuccess", {
      amount: DAILY_CHECK_IN_REWARD,
    });
    setCheckInNotice(successMessage);
    showToast(successMessage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_SOFT_CURRENCY, String(nextCurrency));
      window.localStorage.setItem(STORAGE_LAST_CHECKIN, todayKey);
    }
  };

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

  const formattedPool = poolAmount.toLocaleString();
  const formattedJackpotTime = formatMmSs(jackpotRemainingSec);

  const heroCardText = {
    title: t("card.activeTitle"),
    characterName: t("card.characterName"),
    topActionLabel: canDailyCheckIn
      ? t("cta.dailyCheckIn")
      : t("cta.dailyCheckInDone"),
    topActionDisabled: !canDailyCheckIn,
    onTopActionClick: handleDailyCheckIn,
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
        description={
          canDailyCheckIn
            ? t("card.checkinSubWithReward", { amount: DAILY_CHECK_IN_REWARD })
            : t("card.checkinAlreadyDone")
        }
        footnote={checkInNotice || t("card.cooldownSub")}
        expanded={isInfoExpanded}
        onToggle={() => setIsInfoExpanded((prev) => !prev)}
      />
      {toastMessage ? <ToastMessage message={toastMessage} /> : null}
    </Main>
  );
}

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readSoftCurrencyFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_SOFT_CURRENCY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCheckInDateFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_LAST_CHECKIN);
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
