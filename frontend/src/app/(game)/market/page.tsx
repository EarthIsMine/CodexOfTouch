"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type MarketSkill = {
  id: number;
  name: string;
  description: string;
  effectType: string;
  value: number;
  durationSec: number;
  priceWld: number;
  isOwned: boolean;
  isActivated: boolean;
  activationRemainingTime: number;
};

export default function MarketPage() {
  const t = useTranslations("home");
  const [skills, setSkills] = useState<MarketSkill[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingSkillId, setPendingSkillId] = useState<number | null>(null);
  const [authTestResult, setAuthTestResult] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadSkills = async () => {
      try {
        const response = await fetch("/api/dev/skills", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          data?: {
            skills: MarketSkill[];
          };
        };

        if (!mounted) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.data) {
          setNotice(payload.error || t("market.loadFailed"));
          return;
        }

        setSkills(payload.data.skills);
      } catch {
        if (mounted) {
          setNotice(t("market.loadFailed"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSkills();
    return () => {
      mounted = false;
    };
  }, [t]);

  const ownedCount = useMemo(
    () => skills.filter((skill) => skill.isOwned).length,
    [skills],
  );

  const buySkill = async (skillId: number, skillName: string) => {
    if (pendingSkillId !== null) {
      return;
    }

    setPendingSkillId(skillId);
    try {
      const response = await fetch(`/api/dev/skills/${skillId}/purchase`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setNotice(payload.error || t("market.purchaseFailed"));
        return;
      }

      setSkills((prev) =>
        prev.map((skill) =>
          skill.id === skillId
            ? {
                ...skill,
                isOwned: true,
                isActivated: true,
              }
            : skill,
        ),
      );
      setNotice(t("market.purchased", { skill: skillName }));
    } catch {
      setNotice(t("market.purchaseFailed"));
    } finally {
      setPendingSkillId(null);
    }
  };

  const activateSkill = async (skillId: number, skillName: string) => {
    if (pendingSkillId !== null) {
      return;
    }

    setPendingSkillId(skillId);
    try {
      const response = await fetch(`/api/dev/skills/${skillId}/use`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setNotice(payload.error || t("market.activateFailed"));
        return;
      }

      setSkills((prev) =>
        prev.map((skill) =>
          skill.id === skillId ? { ...skill, isActivated: true } : skill,
        ),
      );
      setNotice(t("market.activated", { skill: skillName }));
    } catch {
      setNotice(t("market.activateFailed"));
    } finally {
      setPendingSkillId(null);
    }
  };

  const testBackendAuth = async () => {
    setAuthTestResult("Testing...");
    try {
      const response = await fetch("/api/dev/backend-auth-test", {
        method: "GET",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        status?: number;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setAuthTestResult(
          `Failed (${payload.status ?? response.status}): ${payload.error ?? "Unknown error"}`,
        );
        return;
      }

      setAuthTestResult(`Success (${payload.status ?? response.status})`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown client error";
      setAuthTestResult(`Failed: ${message}`);
    }
  };

  return (
    <Main>
      <FlowRow>
        <FlowLink href="/">{t("flow.toHome")}</FlowLink>
      </FlowRow>

      <MarketPanel>
        <HeaderRow>
          <TitleBlock>
            <Label>{t("dock.market")}</Label>
            <Title>{t("market.title")}</Title>
            <Subtitle>{t("market.subtitle")}</Subtitle>
          </TitleBlock>
          <BalanceCard>
            <BalanceLabel>{t("market.ownedCountLabel")}</BalanceLabel>
            <BalanceValue>{ownedCount}</BalanceValue>
          </BalanceCard>
        </HeaderRow>

        <SkillGrid>
          {loading ? <LoadingText>{t("market.loading")}</LoadingText> : null}
          {!loading &&
            skills.map((skill) => {
              const isPending = pendingSkillId === skill.id;
              return (
                <SkillCard key={skill.id}>
                  <SkillTop>
                    <SkillName>{skill.name}</SkillName>
                    <SkillPrice>{skill.priceWld} WLD</SkillPrice>
                  </SkillTop>
                  <SkillBody>{skill.description}</SkillBody>
                  <SkillMeta>
                    {skill.effectType} · {skill.durationSec}s
                  </SkillMeta>
                  <ButtonRow>
                    <BuyButton
                      type="button"
                      onClick={() => buySkill(skill.id, skill.name)}
                      disabled={skill.isOwned || isPending}
                      data-owned={skill.isOwned}
                    >
                      {skill.isOwned ? t("market.owned") : t("market.buy")}
                    </BuyButton>
                    <UseButton
                      type="button"
                      onClick={() => activateSkill(skill.id, skill.name)}
                      disabled={!skill.isOwned || skill.isActivated || isPending}
                    >
                      {skill.isActivated
                        ? t("market.alreadyActivated")
                        : t("market.activate")}
                    </UseButton>
                  </ButtonRow>
                </SkillCard>
              );
            })}
        </SkillGrid>

        <PolicyBlock>
          <PolicyTitle>{t("market.principleTitle")}</PolicyTitle>
          <PolicyText>{t("market.principleBody")}</PolicyText>
          <PolicyTitle>{t("market.onchainTitle")}</PolicyTitle>
          <PolicyText>{t("market.onchainBody")}</PolicyText>
        </PolicyBlock>

        {notice ? <Notice>{notice}</Notice> : null}

        <TestBlock>
          <TestButton type="button" onClick={testBackendAuth}>
            Test Backend Auth
          </TestButton>
          {authTestResult ? <TestResult>{authTestResult}</TestResult> : null}
        </TestBlock>
      </MarketPanel>
    </Main>
  );
}

const Main = styled.main`
  flex: 1;
  min-height: 0;
  padding: 0 14px;
  display: flex;
  flex-direction: column;
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

const MarketPanel = styled.section`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: 16px;
  border: 1px solid rgba(104, 212, 255, 0.24);
  background: rgba(6, 22, 46, 0.72);
  padding: 14px;
  display: grid;
  gap: 12px;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: start;
`;

const Label = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(164, 219, 255, 0.82);
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 4px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  color: rgba(235, 247, 255, 0.98);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(188, 228, 248, 0.9);
`;

const BalanceCard = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(121, 220, 255, 0.34);
  background: rgba(6, 31, 58, 0.72);
`;

const BalanceLabel = styled.div`
  font-size: 11px;
  color: rgba(190, 233, 255, 0.8);
  text-transform: uppercase;
`;

const BalanceValue = styled.div`
  margin-top: 2px;
  font-size: 20px;
  font-weight: 800;
  color: rgba(236, 248, 255, 0.98);
`;

const SkillGrid = styled.div`
  display: grid;
  gap: 10px;
`;

const SkillCard = styled.article`
  border-radius: 12px;
  border: 1px solid rgba(119, 211, 249, 0.26);
  background: rgba(7, 30, 61, 0.74);
  padding: 11px 12px;
`;

const SkillTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const SkillName = styled.h3`
  margin: 0;
  font-size: 15px;
  color: rgba(224, 245, 255, 0.98);
`;

const SkillPrice = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: rgba(164, 232, 255, 0.92);
`;

const SkillBody = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(191, 230, 249, 0.92);
`;

const SkillMeta = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(166, 212, 236, 0.82);
`;

const ButtonRow = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const BuyButton = styled.button`
  height: 34px;
  border-radius: 10px;
  padding: 0 12px;
  border: 1px solid rgba(121, 220, 255, 0.42);
  background: rgba(21, 87, 141, 0.58);
  color: rgba(231, 248, 255, 0.96);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &[data-owned="true"] {
    border-color: rgba(110, 225, 174, 0.46);
    background: rgba(27, 112, 82, 0.58);
  }
`;

const UseButton = styled(BuyButton)`
  border-color: rgba(198, 222, 255, 0.4);
  background: rgba(40, 78, 122, 0.56);
`;

const PolicyBlock = styled.section`
  border-radius: 12px;
  border: 1px solid rgba(116, 202, 238, 0.22);
  background: rgba(5, 24, 48, 0.66);
  padding: 10px 12px;
  display: grid;
  gap: 4px;
`;

const PolicyTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: rgba(208, 239, 255, 0.94);
`;

const PolicyText = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(180, 220, 242, 0.86);
`;

const Notice = styled.div`
  border-radius: 10px;
  border: 1px solid rgba(124, 215, 255, 0.24);
  background: rgba(7, 39, 73, 0.66);
  padding: 8px 10px;
  font-size: 12px;
  color: rgba(213, 242, 255, 0.95);
`;

const LoadingText = styled.div`
  font-size: 13px;
  color: rgba(213, 242, 255, 0.95);
`;

const TestBlock = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(124, 215, 255, 0.24);
  background: rgba(7, 39, 73, 0.5);
  padding: 10px;
  display: grid;
  gap: 8px;
`;

const TestButton = styled.button`
  height: 34px;
  border-radius: 9px;
  padding: 0 12px;
  border: 1px solid rgba(121, 220, 255, 0.42);
  background: rgba(21, 87, 141, 0.58);
  color: rgba(231, 248, 255, 0.96);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const TestResult = styled.div`
  font-size: 12px;
  color: rgba(213, 242, 255, 0.95);
`;
