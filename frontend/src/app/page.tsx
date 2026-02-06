"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <Container>
      <Header>
        <Title>{t("title")}</Title>
        <Subtitle>{t("subtitle")}</Subtitle>
      </Header>

      <Main>
        <CharacterCard>
          <CharacterPlaceholder />
          <CharacterName>???</CharacterName>
        </CharacterCard>
      </Main>

      <BottomCTA>
        <PetButton>{t("pet")}</PetButton>
      </BottomCTA>
    </Container>
  );
}

/* =========================
   Styled Components
========================= */

const Container = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-neutral-200);
`;

const Header = styled.header`
  padding: var(--space-6) var(--space-4) var(--space-4);
`;

const Title = styled.h1`
  font-size: var(--font-size-h1);
  color: var(--color-neutral-1000);
`;

const Subtitle = styled.p`
  margin-top: var(--space-2);
  font-size: var(--font-size-subtitle);
  line-height: var(--line-height-subtitle);
  color: var(--color-neutral-700);
`;

const Main = styled.main`
  flex: 1;
  padding: var(--space-4);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CharacterCard = styled.div`
  width: 100%;
  max-width: 320px;
  background: var(--color-neutral-100);
  border-radius: 16px;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
`;

const CharacterPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 999px;
  background: var(--color-neutral-300);
  margin-bottom: var(--space-4);
`;

const CharacterName = styled.span`
  font-size: var(--font-size-subtitle);
  color: var(--color-neutral-800);
`;

const BottomCTA = styled.div`
  padding: var(--space-4);
  position: sticky;
  bottom: 0;
  background: linear-gradient(
    to top,
    var(--color-neutral-200),
    rgba(249, 250, 251, 0)
  );
`;

const PetButton = styled.button`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: var(--color-brand-500);
  color: white;
  font-size: var(--font-size-subtitle);
  font-weight: 600;
`;
