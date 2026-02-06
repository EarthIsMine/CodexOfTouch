"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import AccordionPanel from "@/ui/primitives/AccordionPanel";

export default function RulesPage() {
  const t = useTranslations("home");
  const [feed, setFeed] = useState<
    Array<{
      roundId: number;
      characterName: string;
      winnerWallet: string;
      amount: number;
      committedAt: string;
    }>
  >([]);
  const rules = [
    {
      title: t("rulesPage.items.jackpot.title"),
      body: t("rulesPage.items.jackpot.body"),
    },
    {
      title: t("rulesPage.items.lastTouch.title"),
      body: t("rulesPage.items.lastTouch.body"),
    },
    {
      title: t("rulesPage.items.cooldown.title"),
      body: t("rulesPage.items.cooldown.body"),
    },
    {
      title: t("rulesPage.items.checkin.title"),
      body: t("rulesPage.items.checkin.body"),
    },
  ];

  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      try {
        const response = await fetch("/api/dev/jackpot-history?limit=12", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            history: Array<{
              roundId: number;
              characterName: string;
              winnerWallet: string;
              amount: number;
              committedAt: string;
            }>;
          };
        };

        if (!mounted || !response.ok || !payload.ok || !payload.data) {
          return;
        }

        setFeed(payload.data.history);
      } catch {
        // Keep fallback lines when history request fails.
      }
    };

    void loadFeed();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Main>
      <FlowRow>
        <FlowLink href="/market">{t("flow.toMarket")}</FlowLink>
      </FlowRow>

      <RulesPanel
        title={<RulesTitle>{t("rulesPage.title")}</RulesTitle>}
        defaultOpen
      >
        <RulesContent>
          <RulesSubtitle>{t("rulesPage.subtitle")}</RulesSubtitle>
          <RuleGrid>
            {rules.map((rule) => (
              <RuleCard key={rule.title}>
                <RuleCardTitle>{rule.title}</RuleCardTitle>
                <RuleCardBody>{rule.body}</RuleCardBody>
              </RuleCard>
            ))}
          </RuleGrid>
        </RulesContent>
      </RulesPanel>

      <FeedPanel
        title={<FeedTitle>{t("rulesPage.recentTitle")}</FeedTitle>}
        defaultOpen
        fillWhenOpen
      >
        <FeedContent>
          {feed.length === 0 ? (
            <>
              <FeedLine data-tone="ok">
                {t("feed.success", {
                  name: "Puddle",
                  user: "Mingh",
                  action: "Minting",
                })}
              </FeedLine>
              <FeedLine data-tone="warn">
                {t("feed.fail", { seconds: 30 })}
              </FeedLine>
            </>
          ) : (
            feed.map((item) => (
              <FeedLine key={item.roundId} data-tone="ok">
                {t("feed.jackpotWin", {
                  name: item.characterName,
                  user: item.winnerWallet,
                  amount: item.amount.toLocaleString(),
                })}
              </FeedLine>
            ))
          )}
        </FeedContent>
      </FeedPanel>
    </Main>
  );
}

const Main = styled.main`
  flex: 1;
  min-height: 0;
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

const RulesPanel = styled(AccordionPanel)`
  flex-shrink: 0;
  border-radius: 16px;
  border: 1px solid rgba(109, 218, 255, 0.22);
  background: rgba(4, 20, 45, 0.74);
  padding: 12px;
`;

const RulesTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: rgba(227, 246, 255, 0.98);
`;

const RulesContent = styled.div`
  margin-top: 6px;
`;

const RulesSubtitle = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(188, 228, 248, 0.9);
`;

const RuleGrid = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 8px;
`;

const RuleCard = styled.article`
  border-radius: 12px;
  border: 1px solid rgba(117, 208, 244, 0.24);
  background: rgba(7, 30, 61, 0.74);
  padding: 10px 12px;
`;

const RuleCardTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  color: rgba(218, 245, 255, 0.98);
`;

const RuleCardBody = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(192, 229, 247, 0.92);
`;

const FeedPanel = styled(AccordionPanel)`
  flex: 1;
  min-height: 0;
  border-radius: 14px;
  border: 1px solid rgba(109, 218, 255, 0.18);
  background: rgba(4, 20, 45, 0.7);
  overflow: hidden;
  padding: 10px 12px;
`;

const FeedTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: rgba(206, 240, 255, 0.94);
`;

const FeedContent = styled.div`
  margin-top: 6px;
`;

const FeedLine = styled.div`
  padding: 9px 0;
  font-size: 13px;
  line-height: 1.4;
  border-top: 1px solid rgba(102, 192, 235, 0.16);

  &:first-of-type {
    margin-top: 6px;
  }

  &[data-tone="ok"] {
    color: rgba(154, 241, 237, 0.9);
  }

  &[data-tone="warn"] {
    color: rgba(220, 235, 248, 0.86);
  }
`;
