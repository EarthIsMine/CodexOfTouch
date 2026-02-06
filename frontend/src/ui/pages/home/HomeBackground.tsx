"use client";

import styled from "@emotion/styled";
import type { ReactNode } from "react";

type HomeBackgroundProps = {
  children: ReactNode;
};

export default function HomeBackground({ children }: HomeBackgroundProps) {
  return (
    <Screen>
      <BackgroundStars aria-hidden />
      {children}
    </Screen>
  );
}

const Screen = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(
      1200px 800px at 20% 10%,
      rgba(124, 111, 246, 0.18),
      transparent 60%
    ),
    radial-gradient(
      1000px 700px at 80% 20%,
      rgba(52, 211, 153, 0.12),
      transparent 55%
    ),
    radial-gradient(
      900px 600px at 50% 90%,
      rgba(255, 255, 255, 0.06),
      transparent 60%
    ),
    linear-gradient(180deg, #070914 0%, #050611 40%, #03040c 100%);
  color: rgba(255, 255, 255, 0.92);
`;

const BackgroundStars = styled.div`
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;

  /* “랜덤처럼 보이는” 별빛 레이어 */
  background-image:
    radial-gradient(
      1px 1px at 12% 18%,
      rgba(255, 255, 255, 0.9) 40%,
      transparent 41%
    ),
    radial-gradient(
      1px 1px at 28% 62%,
      rgba(255, 255, 255, 0.6) 40%,
      transparent 41%
    ),
    radial-gradient(
      1px 1px at 44% 24%,
      rgba(255, 255, 255, 0.7) 40%,
      transparent 41%
    ),
    radial-gradient(
      1px 1px at 61% 78%,
      rgba(255, 255, 255, 0.65) 40%,
      transparent 41%
    ),
    radial-gradient(
      1px 1px at 77% 36%,
      rgba(255, 255, 255, 0.75) 40%,
      transparent 41%
    ),
    radial-gradient(
      1px 1px at 86% 58%,
      rgba(255, 255, 255, 0.55) 40%,
      transparent 41%
    ),
    radial-gradient(
      1px 1px at 18% 84%,
      rgba(255, 255, 255, 0.6) 40%,
      transparent 41%
    ),
    radial-gradient(
      2px 2px at 52% 14%,
      rgba(124, 111, 246, 0.55) 35%,
      transparent 36%
    ),
    radial-gradient(
      2px 2px at 72% 88%,
      rgba(52, 211, 153, 0.45) 35%,
      transparent 36%
    );

  opacity: 0.75;
  filter: blur(0.2px);
  animation: twinkle 6.5s ease-in-out infinite;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        3px 3px at 18% 22%,
        rgba(255, 255, 255, 0.95) 45%,
        rgba(255, 255, 255, 0) 65%
      ),
      radial-gradient(
        4px 4px at 36% 68%,
        rgba(124, 111, 246, 0.9) 40%,
        rgba(124, 111, 246, 0) 70%
      ),
      radial-gradient(
        3px 3px at 62% 28%,
        rgba(255, 255, 255, 0.9) 45%,
        rgba(255, 255, 255, 0) 70%
      ),
      radial-gradient(
        5px 5px at 78% 52%,
        rgba(52, 211, 153, 0.85) 40%,
        rgba(52, 211, 153, 0) 72%
      ),
      radial-gradient(
        4px 4px at 82% 18%,
        rgba(255, 255, 255, 0.85) 45%,
        rgba(255, 255, 255, 0) 70%
      ),
      radial-gradient(
        3px 3px at 12% 78%,
        rgba(255, 255, 255, 0.8) 45%,
        rgba(255, 255, 255, 0) 70%
      );
    opacity: 0.85;
    filter: blur(0.4px);
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.65;
    }
    50% {
      opacity: 0.9;
    }
  }
`;
