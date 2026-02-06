"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type CollectionItem = {
  id: number;
  name: string;
  level: number;
  owned: boolean;
  isActive: boolean;
};

export default function CodexPage() {
  const t = useTranslations("home");
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCodex = async () => {
      try {
        const response = await fetch("/api/dev/codex-overview", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            items: Array<{
              id: number;
              name: string;
              level: number;
              owned: boolean;
              isActive: boolean;
            }>;
          };
        };
        if (!mounted || !response.ok || !payload.ok || !payload.data) {
          return;
        }
        setCollection(payload.data.items);
      } catch {
        // Keep empty fallback list if request fails.
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCodex();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleCollection = useMemo(
    () =>
      collection.length > 0
        ? collection
        : [
            { id: 1, name: "Nyx", level: 8, owned: true, isActive: true },
            { id: 2, name: "Astra", level: 6, owned: false, isActive: false },
            { id: 3, name: "Puddle", level: 5, owned: false, isActive: false },
          ],
    [collection],
  );

  return (
    <Main>
      <FlowRow>
        <FlowLink href="/rules">{t("flow.toRules")}</FlowLink>
      </FlowRow>
      <CollectionPanel>
        <CollectionHeader>
          <CollectionTitle>{t("collection.title")}</CollectionTitle>
          {loading ? <LoadingText>{t("collection.loading")}</LoadingText> : null}
        </CollectionHeader>
        <CollectionGrid>
          {visibleCollection.map((pet, index) => (
            <PetCard key={pet.id} data-owned={pet.owned} data-active={pet.isActive}>
              <PetThumb data-index={index} />
              <PetMeta>
                <PetLevel>{t("collection.level", { level: pet.level })}</PetLevel>
                <PetState>
                  {pet.owned ? t("collection.owned") : t("collection.locked")}
                </PetState>
              </PetMeta>
              <PetName>{pet.name}</PetName>
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

  &[data-active="true"] {
    box-shadow: 0 0 20px rgba(95, 218, 255, 0.24);
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

const PetName = styled.div`
  margin-top: 4px;
  padding: 0 2px;
  font-size: 12px;
  color: rgba(184, 229, 251, 0.92);
`;

const LoadingText = styled.span`
  font-size: 12px;
  color: rgba(187, 230, 250, 0.84);
`;
