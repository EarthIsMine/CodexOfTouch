"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import CharacterStatusCard from "@/ui/cards/CharacterStatusCard";
import InfoStatCard from "@/ui/cards/InfoStatCard";
import ToastMessage from "@/ui/primitives/ToastMessage";

const DAILY_CHECK_IN_REWARD = 20;
const FALLBACK_JACKPOT_POOL = 238;
const FALLBACK_JACKPOT_SECONDS = 142;

export default function HomePage() {
  const t = useTranslations("home");
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const cooldownSec = 0;
  const [softCurrency, setSoftCurrency] = useState(12);
  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(null);
  const [jackpotPool, setJackpotPool] = useState(FALLBACK_JACKPOT_POOL);
  const [jackpotRemainingSec, setJackpotRemainingSec] = useState(
    FALLBACK_JACKPOT_SECONDS,
  );
  const [activeCharacterId, setActiveCharacterId] = useState(0);
  const [isJackpotLive, setIsJackpotLive] = useState(false);
  const [poolAmount, setPoolAmount] = useState(FALLBACK_JACKPOT_POOL);
  const [characterName, setCharacterName] = useState("");
  const [characterHtmlUrl, setCharacterHtmlUrl] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInNotice, setCheckInNotice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<number | null>(null);
  const todayKey = getTodayKey();

  const canDailyCheckIn = lastCheckInDate !== todayKey;

  const loadHomeStats = useCallback(async () => {
    try {
      const response = await fetch("/api/dev/home-stats", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          characterId: number;
          characterName: string;
          characterHtmlUrl: string;
          jackpotPool: number;
          jackpot: number;
          poolAmount: number;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        return;
      }

      setActiveCharacterId(payload.data.characterId);
      setJackpotPool(payload.data.jackpotPool);
      setJackpotRemainingSec(payload.data.jackpot);
      setPoolAmount(payload.data.poolAmount);
      setCharacterName(payload.data.characterName);
      setCharacterHtmlUrl(payload.data.characterHtmlUrl);
      setIsJackpotLive(true);
    } catch {
      // Keep current values when backend route is unavailable.
    }
  }, []);

  const loadUserSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/dev/user-summary", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          internalBalance: number;
          lastCheckIn: string | null;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        return;
      }

      setSoftCurrency(payload.data.internalBalance);
      setLastCheckInDate(toDateKey(payload.data.lastCheckIn));
    } catch {
      // Keep current values when backend route is unavailable.
    }
  }, []);

  const handleDailyCheckIn = async () => {
    if (isCheckingIn) {
      return;
    }

    if (!canDailyCheckIn) {
      setCheckInNotice(t("card.checkinAlreadyDone"));
      return;
    }

    setIsCheckingIn(true);
    try {
      const response = await fetch("/api/dev/checkin", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: {
          reward: number;
          totalBalance: number;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        const errorMessage = payload.error || t("card.checkinFailed");
        setCheckInNotice(errorMessage);
        showToast(errorMessage);
        return;
      }

      setSoftCurrency(payload.data.totalBalance);
      setLastCheckInDate(todayKey);
      const successMessage = t("card.checkinSuccess", {
        amount: payload.data.reward,
      });
      setCheckInNotice(successMessage);
      showToast(successMessage);
    } catch {
      const errorMessage = t("card.checkinFailed");
      setCheckInNotice(errorMessage);
      showToast(errorMessage);
    } finally {
      setIsCheckingIn(false);
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

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      try {
        if (!mounted) {
          return;
        }
        await loadUserSummary();
      } catch {
        // Fallback values remain when backend test route is unavailable.
      }
    };

    void loadHomeStats();
    void loadHomeData();

    return () => {
      mounted = false;
    };
  }, [loadHomeStats, loadUserSummary]);

  useEffect(() => {
    const onRefresh = () => {
      void loadHomeStats();
      void loadUserSummary();
    };

    window.addEventListener("codex:refresh-home-stats", onRefresh);
    return () => {
      window.removeEventListener("codex:refresh-home-stats", onRefresh);
    };
  }, [loadHomeStats, loadUserSummary]);

  useEffect(() => {
    if (!isJackpotLive) {
      return;
    }

    const timer = window.setInterval(() => {
      setJackpotRemainingSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isJackpotLive]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;

    const connect = async () => {
      try {
        const response = await fetch("/api/dev/ws-config", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            jackpotWsUrl: string;
          };
        };

        if (!response.ok || !payload.ok || !payload.data?.jackpotWsUrl || stopped) {
          return;
        }

        socket = new WebSocket(payload.data.jackpotWsUrl);
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as {
              type?: string;
              characterId?: number;
              currentPool?: number;
              timeRemaining?: number;
            };

            if (message.type !== "jackpot:update") {
              return;
            }

            if (
              activeCharacterId > 0 &&
              Number(message.characterId ?? 0) !== activeCharacterId
            ) {
              return;
            }

            setJackpotPool(Number(message.currentPool ?? 0));
            setPoolAmount(Number(message.currentPool ?? 0));
            setJackpotRemainingSec(Number(message.timeRemaining ?? 0));
            setIsJackpotLive(true);
          } catch {
            // Ignore malformed websocket payloads.
          }
        };

        socket.onclose = () => {
          if (stopped) {
            return;
          }
          reconnectTimer = window.setTimeout(() => {
            void connect();
          }, 1000);
        };
      } catch {
        if (stopped) {
          return;
        }
        reconnectTimer = window.setTimeout(() => {
          void connect();
        }, 1000);
      }
    };

    void connect();
    return () => {
      stopped = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [activeCharacterId]);

  const formattedJackpotPool = jackpotPool.toLocaleString();
  const formattedPool = poolAmount.toLocaleString();
  const formattedJackpotTime = formatMmSs(jackpotRemainingSec);

  const heroCardText = {
    title: t("card.activeTitle"),
    characterName: characterName || t("card.characterName"),
    characterHtmlUrl,
    topActionLabel: isCheckingIn
      ? t("cta.checkingIn")
      : canDailyCheckIn
        ? t("cta.dailyCheckIn")
        : t("cta.dailyCheckInDone"),
    topActionDisabled: isCheckingIn || !canDailyCheckIn,
    onTopActionClick: handleDailyCheckIn,
    jackpotPoolLabel: t("card.jackpotPool"),
    jackpotPoolValue: formattedJackpotPool,
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

function toDateKey(isoDateTime: string | null) {
  if (!isoDateTime) {
    return null;
  }
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
