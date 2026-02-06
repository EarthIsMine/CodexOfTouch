"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

type LanguageButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function LanguageButton(props: LanguageButtonProps) {
  const router = useRouter();
  const localeFromIntl = useLocale();
  const locale = normalizeLocale(localeFromIntl);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("common");
  const selectedLocale = pendingLocale ?? locale;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setIsOpen((prev) => !prev);
    props.onClick?.(event);
  };

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale === selectedLocale) {
      setIsOpen(false);
      return;
    }

    setLocaleCookie(nextLocale);
    setPendingLocale(nextLocale);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <Wrapper>
      <Button
        type="button"
        aria-label={t("changeLanguageAria", { locale: selectedLocale })}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={t("changeLanguageTitle", { locale: selectedLocale })}
        {...props}
        onClick={handleClick}
      >
        🌐
      </Button>

      {isOpen ? (
        <Tooltip role="listbox" aria-label="Select language">
          {locales.map((option) => (
            <OptionButton
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              data-active={option === selectedLocale}
            >
              {option}
            </OptionButton>
          ))}
        </Tooltip>
      ) : null}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
`;

const Button = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
`;

const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  padding: 6px;
  border-radius: 12px;
  display: grid;
  gap: 6px;
  min-width: 72px;

  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(12, 12, 22, 0.82);
  backdrop-filter: blur(16px);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const OptionButton = styled.button`
  height: 32px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &[data-active="true"] {
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.14);
  }
`;

const LOCALE_COOKIE = "NEXT_LOCALE";
function normalizeLocale(value: string): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
