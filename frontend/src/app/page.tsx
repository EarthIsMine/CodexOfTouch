"use client";

import styled from "@emotion/styled";
import { useTranslations } from "next-intl";

import CTAButton from "@/ui/CTAButton";

type Locale = "ko" | "en";

export default function I18nTestPage() {
  const t = useTranslations("common");

  const handleChangeLocale = (locale: Locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <Container>
      {/* Language Switch */}
      <LangSwitch>
        <LangButton onClick={() => handleChangeLocale("ko")}>🇰🇷 KO</LangButton>
        <LangButton onClick={() => handleChangeLocale("en")}>🇺🇸 EN</LangButton>
      </LangSwitch>

      {/* Title */}
      <Section>
        <Heading>CodexOfTouch</Heading>
        <Subtitle>{t("i18nTest")}</Subtitle>
      </Section>

      {/* CTA Test */}
      <Section>
        <CTAButton variant="brand">Brand 500 CTA</CTAButton>
        <CTAButton variant="secondary">Secondary 500 CTA</CTAButton>
      </Section>

      {/* i18n Text Test */}
      <Section>
        <Text>{t("confirm")}</Text>
        <Text>{t("cancel")}</Text>
      </Section>
    </Container>
  );
}

/* =========================
   Styled Components
========================= */

const Container = styled.main`
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-6);
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  gap: var(--space-7);

  background-color: var(--color-neutral-1000);
`;

const LangSwitch = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const LangButton = styled.button`
  padding: 8px 12px;
  border-radius: 10px;

  background-color: var(--color-neutral-800);
  color: var(--color-neutral-100);

  font-size: var(--font-size-caption);
  font-weight: 800;

  &:active {
    background-color: var(--color-neutral-700);
    transform: scale(0.98);
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Heading = styled.h1`
  font-size: var(--font-size-h1);
  color: var(--color-neutral-100);
`;

const Subtitle = styled.p`
  font-size: var(--font-size-subtitle);
  color: var(--color-neutral-400);
`;

const Text = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-neutral-200);
`;
