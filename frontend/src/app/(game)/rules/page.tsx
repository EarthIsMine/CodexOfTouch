"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RulesPage() {
  const t = useTranslations("home");

  return (
    <Main>
      <FlowRow>
        <FlowLink href="/market">{t("flow.toMarket")}</FlowLink>
      </FlowRow>
      <FeedPanel>
        <FeedLine data-tone="ok">
          {t("feed.success", {
            name: "Puddle",
            user: "Mingh",
            action: "Minting",
          })}
        </FeedLine>
        <FeedLine data-tone="warn">{t("feed.fail", { seconds: 30 })}</FeedLine>
      </FeedPanel>
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
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
`;

const FeedPanel = styled.section`
  border-radius: 14px;
  border: 1px solid rgba(109, 218, 255, 0.18);
  background: rgba(4, 20, 45, 0.7);
  overflow: hidden;
`;

const FeedLine = styled.div`
  padding: 9px 12px;
  font-size: 12px;
  line-height: 1.4;
  border-top: 1px solid rgba(102, 192, 235, 0.16);

  &:first-of-type {
    border-top: 0;
  }

  &[data-tone="ok"] {
    color: rgba(154, 241, 237, 0.9);
  }

  &[data-tone="warn"] {
    color: rgba(220, 235, 248, 0.86);
  }
`;
