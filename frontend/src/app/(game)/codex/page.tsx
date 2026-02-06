"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useTranslations } from "next-intl";

const collection = [
  { id: "nx-01", level: 8, owned: true },
  { id: "nx-02", level: 8, owned: true },
  { id: "nx-03", level: 7, owned: false },
  { id: "nx-04", level: 8, owned: true },
  { id: "nx-05", level: 2, owned: false },
  { id: "nx-06", level: 3, owned: true },
  { id: "nx-07", level: 5, owned: true },
  { id: "nx-08", level: 9, owned: false },
];

export default function CodexPage() {
  const t = useTranslations("home");

  return (
    <Main>
      <FlowRow>
        <FlowLink href="/rules">{t("flow.toRules")}</FlowLink>
      </FlowRow>
      <CollectionPanel>
        <CollectionHeader>
          <CollectionTitle>{t("collection.title")}</CollectionTitle>
        </CollectionHeader>
        <CollectionGrid>
          {collection.map((pet, index) => (
            <PetCard key={pet.id} data-owned={pet.owned}>
              <PetThumb data-index={index} />
              <PetMeta>
                <PetLevel>{t("collection.level", { level: pet.level })}</PetLevel>
                <PetState>
                  {pet.owned ? t("collection.owned") : t("collection.locked")}
                </PetState>
              </PetMeta>
            </PetCard>
          ))}
        </CollectionGrid>
      </CollectionPanel>
    </Main>
  );
}

const Main = styled.main`
  padding: 0 14px;
`;

const FlowRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
`;

const FlowLink = styled(Link)`
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(113, 221, 255, 0.34);
  color: rgba(205, 241, 255, 0.92);
  background: rgba(9, 40, 70, 0.62);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
`;

const CollectionPanel = styled.section`
  border-radius: 18px;
  border: 1px solid rgba(104, 212, 255, 0.24);
  background: rgba(6, 22, 46, 0.72);
  padding: 12px;
`;

const CollectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const CollectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(178, 230, 255, 0.9);
`;

const CollectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
`;

const PetCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(122, 214, 255, 0.2);
  background: rgba(8, 29, 61, 0.78);
  padding: 6px;

  &[data-owned="false"] {
    opacity: 0.6;
  }
`;

const PetThumb = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background:
    radial-gradient(
      16px 14px at 30% 30%,
      rgba(255, 255, 255, 0.4),
      rgba(255, 255, 255, 0) 70%
    ),
    radial-gradient(
      36px 30px at 52% 56%,
      rgba(86, 216, 255, 0.88),
      rgba(53, 140, 243, 0.75) 64%,
      rgba(24, 62, 142, 0.65) 100%
    );
  box-shadow: inset 0 -14px 18px rgba(238, 129, 70, 0.36);

  &[data-index="1"],
  &[data-index="4"] {
    filter: hue-rotate(35deg);
  }

  &[data-index="2"],
  &[data-index="6"] {
    filter: hue-rotate(90deg) saturate(0.45);
  }

  &[data-index="3"],
  &[data-index="7"] {
    filter: hue-rotate(-55deg);
  }
`;

const PetMeta = styled.div`
  margin-top: 6px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
`;

const PetLevel = styled.span`
  font-size: 14px;
  color: rgba(164, 218, 244, 0.84);
`;

const PetState = styled.span`
  font-size: 13px;
  color: rgba(213, 243, 255, 0.88);
  text-transform: uppercase;
`;
