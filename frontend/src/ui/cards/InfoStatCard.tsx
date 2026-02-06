"use client";

import styled from "@emotion/styled";

type StatRow = {
  label: string;
  value: string;
};

export type InfoStatCardProps = {
  rows: StatRow[];
  description: string;
  footnote: string;
  expanded: boolean;
  onToggle: () => void;
};

export default function InfoStatCard({
  rows,
  description,
  footnote,
  expanded,
  onToggle,
}: InfoStatCardProps) {
  return (
    <InfoPanel
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      data-expanded={expanded}
    >
      {rows.map((row, index) => (
        <InfoRow key={row.label}>
          <InfoLabel>{row.label}</InfoLabel>
          <InfoValue>{row.value}</InfoValue>
          {!expanded && index > 0 ? <FadeMask aria-hidden /> : null}
        </InfoRow>
      ))}
      <ExtraContent data-expanded={expanded}>
        <InfoSub>{description}</InfoSub>
        <InfoFoot>{footnote}</InfoFoot>
      </ExtraContent>
      <Chevron aria-hidden data-expanded={expanded}>
        ▾
      </Chevron>
    </InfoPanel>
  );
}

const InfoPanel = styled.button`
  position: relative;
  height: 100%;
  min-height: 0;
  width: 100%;
  padding: clamp(8px, 1.2vh, 12px) 16px;
  border-radius: 16px;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  appearance: none;
  font: inherit;

  border: 1px solid rgba(121, 220, 255, 0.32);
  background: rgba(5, 23, 49, 0.78);
  backdrop-filter: blur(10px);

  &:focus-visible {
    outline: 2px solid rgba(150, 228, 255, 0.7);
    outline-offset: 2px;
  }
`;

const InfoRow = styled.div`
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: clamp(3px, 0.55vh, 5px) 0;
  border-bottom: 1px solid rgba(120, 197, 232, 0.16);

  &:last-of-type {
    border-bottom: 0;
  }
`;

const FadeMask = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 23, 49, 0) 0%,
    rgba(5, 23, 49, 0.62) 56%,
    rgba(5, 23, 49, 0.86) 100%
  );
  pointer-events: none;
`;

const InfoLabel = styled.div`
  font-size: clamp(13px, 1.4vh, 15px);
  color: rgba(199, 237, 255, 0.88);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const InfoValue = styled.div`
  font-size: clamp(15px, 1.95vh, 17px);
  font-weight: 800;
  color: rgba(241, 250, 255, 1);
`;

const InfoSub = styled.div`
  margin-top: clamp(4px, 0.8vh, 6px);
  font-size: clamp(13px, 1.4vh, 15px);
  color: rgba(200, 236, 255, 0.9);
`;

const InfoFoot = styled.div`
  margin-top: 2px;
  font-size: clamp(12px, 1.3vh, 14px);
  color: rgba(176, 220, 242, 0.82);
`;

const ExtraContent = styled.div`
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition:
    max-height 220ms ease,
    opacity 180ms ease;

  &[data-expanded="true"] {
    max-height: 72px;
    opacity: 1;
  }
`;

const Chevron = styled.span`
  position: absolute;
  right: 12px;
  bottom: 8px;
  color: rgba(196, 233, 252, 0.88);
  font-size: 14px;
  transition: transform 200ms ease;

  &[data-expanded="true"] {
    transform: rotate(180deg);
  }
`;
