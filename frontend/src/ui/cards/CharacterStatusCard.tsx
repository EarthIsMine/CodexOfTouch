"use client";

import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ThreeErrorBoundary } from "@/ui/3d/ErrorBoundary";

const Character3DViewer = dynamic(() => import("@/ui/3d/Character3DViewer"), {
  ssr: false,
  loading: () => null,
});

type Emotion = "neutral" | "happy" | "angry";

export type CharacterStatusCardProps = {
  title: string;
  characterName: string;
  characterGlbUrl?: string;
  topActionLabel: string;
  topActionDisabled?: boolean;
  onTopActionClick?: () => void;
  jackpotPoolLabel: string;
  jackpotPoolValue: string;
  primaryStatLabel: string;
  primaryStatValue: string;
  secondaryStatLabel: string;
  secondaryStatValue: string;
  hint: string;
};

export default function CharacterStatusCard({
  title,
  characterName,
  characterGlbUrl,
  topActionLabel,
  topActionDisabled = false,
  onTopActionClick,
  jackpotPoolLabel,
  jackpotPoolValue,
  primaryStatLabel,
  primaryStatValue,
  secondaryStatLabel,
  secondaryStatValue,
  hint,
}: CharacterStatusCardProps) {
  const [emotion, setEmotion] = useState<Emotion>("neutral");

  useEffect(() => {
    const handlePetResult = (event: Event) => {
      const detail = (event as CustomEvent<{ result?: string }>).detail;
      if (!detail?.result) {
        return;
      }
      const mood: Emotion = detail.result === "SUCCESS" ? "happy" : "angry";
      setEmotion(mood);

      // Reset to neutral after animation duration
      setTimeout(() => {
        setEmotion("neutral");
      }, 2000);
    };

    window.addEventListener("codex:pet-result", handlePetResult);
    return () => {
      window.removeEventListener("codex:pet-result", handlePetResult);
    };
  }, []);

  return (
    <HeroCard>
      <HeroTop>
        <HeroMeta>
          <CardTitle>{title}</CardTitle>
          <CharacterName>{characterName}</CharacterName>
        </HeroMeta>
        <TopActionButton
          type="button"
          onClick={onTopActionClick}
          disabled={topActionDisabled}
        >
          {topActionLabel}
        </TopActionButton>
      </HeroTop>

      <StageArea>
        <Cylinder aria-hidden>
          {characterGlbUrl ? (
            <ThreeErrorBoundary
              fallback={
                <CharacterCore>
                  <GlowBlob />
                </CharacterCore>
              }
            >
              <Character3DViewer glbUrl={characterGlbUrl} emotion={emotion} />
            </ThreeErrorBoundary>
          ) : (
            <CharacterCore>
              <GlowBlob />
            </CharacterCore>
          )}
        </Cylinder>
      </StageArea>

      <BottomStats>
        <Stat>
          <StatLabel>{jackpotPoolLabel}</StatLabel>
          <StatValue>{jackpotPoolValue}</StatValue>
        </Stat>
        <Stat>
          <StatLabel>{primaryStatLabel}</StatLabel>
          <StatValue>{primaryStatValue}</StatValue>
        </Stat>
        <Stat>
          <StatLabel>{secondaryStatLabel}</StatLabel>
          <StatValue>{secondaryStatValue}</StatValue>
        </Stat>
      </BottomStats>

      <CardHint>{hint}</CardHint>
    </HeroCard>
  );
}

const HeroCard = styled.section`
  height: 100%;
  min-height: 0;
  padding: clamp(10px, 1.8vh, 16px);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  border: 1px solid rgba(99, 220, 255, 0.24);
  background:
    linear-gradient(180deg, rgba(7, 20, 40, 0.78), rgba(4, 10, 26, 0.85)),
    radial-gradient(
      100% 140% at 50% 0%,
      rgba(90, 195, 255, 0.14),
      rgba(90, 195, 255, 0) 60%
    );
  backdrop-filter: blur(12px);

  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 30px rgba(71, 207, 255, 0.12);
`;

const HeroTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const HeroMeta = styled.div`
  display: grid;
  gap: 4px;
`;

const CardTitle = styled.div`
  font-size: clamp(13px, 1.5vh, 15px);
  color: rgba(205, 236, 255, 0.92);
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CharacterName = styled.h1`
  margin: 0;
  font-size: clamp(20px, 3vh, 26px);
  line-height: 1.2;
  color: rgba(238, 248, 255, 0.98);
`;

const TopActionButton = styled.button`
  height: clamp(30px, 3.6vh, 36px);
  padding: 0 14px;
  width: fit-content;
  max-width: 100%;
  flex-shrink: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: clamp(13px, 1.5vh, 15px);
  font-weight: 700;
  border: 1px solid rgba(122, 225, 255, 0.52);
  background: rgba(37, 124, 187, 0.42);
  color: rgba(234, 249, 255, 1);

  &:disabled {
    opacity: 0.62;
    cursor: not-allowed;
  }
`;

const StageArea = styled.div`
  margin-top: clamp(10px, 1.4vh, 18px);
  position: relative;
  flex: 1;
  min-height: 130px;
  max-height: 260px;
  align-items: center;
`;

const Cylinder = styled.div`
  position: absolute;
  inset: 8px 20px 22px;
  border-radius: 24px 24px 32px 32px / 20px 20px 28px 28px;
  border: 1px solid rgba(133, 223, 255, 0.4);
  overflow: hidden;
  background:
    linear-gradient(
      90deg,
      rgba(188, 236, 255, 0.2),
      rgba(188, 236, 255, 0.05) 40%,
      rgba(188, 236, 255, 0.16) 78%,
      rgba(188, 236, 255, 0.06)
    ),
    linear-gradient(
      180deg,
      rgba(73, 150, 220, 0.28) 0%,
      rgba(43, 93, 162, 0.1) 48%,
      rgba(50, 181, 255, 0.22) 100%
    );
  box-shadow:
    inset 0 0 34px rgba(133, 223, 255, 0.18),
    0 0 28px rgba(74, 182, 255, 0.2);
`;

const CharacterCore = styled.div`
  position: absolute;
  left: 50%;
  top: 52%;
  width: clamp(82px, 13vh, 126px);
  height: clamp(82px, 13vh, 126px);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  display: grid;
  place-items: center;
`;

const GlowBlob = styled.div`
  width: clamp(68px, 10.5vh, 104px);
  height: clamp(68px, 10.5vh, 104px);
  border-radius: 999px;

  background:
    radial-gradient(
      42px 34px at 35% 30%,
      rgba(255, 255, 255, 0.52),
      rgba(255, 255, 255, 0) 72%
    ),
    radial-gradient(
      90px 78px at 50% 58%,
      rgba(67, 220, 255, 0.88),
      rgba(39, 140, 255, 0.76) 55%,
      rgba(29, 85, 180, 0.65) 100%
    );

  box-shadow:
    0 0 36px rgba(63, 193, 255, 0.46),
    inset 0 -20px 30px rgba(232, 133, 72, 0.42);
`;

const BottomStats = styled.div`
  margin-top: clamp(6px, 1vh, 10px);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const Stat = styled.div`
  padding: clamp(8px, 1vh, 10px) 12px;
  border-radius: 12px;

  background: rgba(4, 26, 53, 0.78);
  border: 1px solid rgba(138, 221, 255, 0.34);
`;

const StatLabel = styled.div`
  font-size: clamp(13px, 1.45vh, 15px);
  color: rgba(194, 236, 255, 0.86);
`;

const StatValue = styled.div`
  margin-top: 4px;
  font-size: clamp(15px, 2.1vh, 19px);
  font-weight: 800;
  color: rgba(241, 250, 255, 0.99);
`;

const CardHint = styled.div`
  margin-top: clamp(6px, 0.8vh, 10px);
  font-size: clamp(13px, 1.4vh, 15px);
  color: rgba(201, 236, 255, 0.92);
  line-height: 1.45;
`;
