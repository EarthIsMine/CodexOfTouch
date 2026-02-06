"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MarketPage() {
  const t = useTranslations("home");

  return (
    <Main>
      <FlowRow>
        <FlowLink href="/">{t("flow.toHome")}</FlowLink>
      </FlowRow>
      <Panel>
        <Label>{t("dock.market")}</Label>
        <Value>{t("market.comingSoon")}</Value>
      </Panel>
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

const Panel = styled.section`
  border-radius: 16px;
  border: 1px solid rgba(104, 212, 255, 0.24);
  background: rgba(6, 22, 46, 0.72);
  padding: 14px;
  display: grid;
  gap: 8px;
`;

const Label = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(164, 219, 255, 0.82);
`;

const Value = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: rgba(226, 247, 255, 0.95);
`;
