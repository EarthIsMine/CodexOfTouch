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
};

export default function InfoStatCard({
  rows,
  description,
  footnote,
}: InfoStatCardProps) {
  return (
    <InfoPanel>
      {rows.map((row) => (
        <InfoRow key={row.label}>
          <InfoLabel>{row.label}</InfoLabel>
          <InfoValue>{row.value}</InfoValue>
        </InfoRow>
      ))}
      <InfoSub>{description}</InfoSub>
      <InfoFoot>{footnote}</InfoFoot>
    </InfoPanel>
  );
}

const InfoPanel = styled.section`
  height: 100%;
  min-height: 0;
  padding: clamp(8px, 1.2vh, 12px) 16px;
  border-radius: 16px;
  overflow: hidden;

  border: 1px solid rgba(103, 213, 255, 0.24);
  background: rgba(7, 28, 57, 0.62);
  backdrop-filter: blur(10px);
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: clamp(3px, 0.55vh, 5px) 0;
`;

const InfoLabel = styled.div`
  font-size: clamp(12px, 1.3vh, 14px);
  color: rgba(169, 225, 255, 0.76);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const InfoValue = styled.div`
  font-size: clamp(14px, 1.8vh, 16px);
  font-weight: 800;
  color: rgba(226, 247, 255, 0.95);
`;

const InfoSub = styled.div`
  margin-top: clamp(4px, 0.8vh, 6px);
  font-size: clamp(12px, 1.3vh, 14px);
  color: rgba(171, 220, 245, 0.76);
`;

const InfoFoot = styled.div`
  margin-top: 2px;
  font-size: clamp(11px, 1.2vh, 13px);
  color: rgba(153, 202, 228, 0.66);
`;
