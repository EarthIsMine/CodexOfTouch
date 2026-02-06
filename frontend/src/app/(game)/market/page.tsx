"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type SkillId = "cooldown" | "dailyBoost" | "inputBlock";

export default function MarketPage() {
  const t = useTranslations("home");
  const [wldBalance, setWldBalance] = useState(120);
  const [ownedSkills, setOwnedSkills] = useState<Record<SkillId, boolean>>({
    cooldown: false,
    dailyBoost: false,
    inputBlock: false,
  });
  const [notice, setNotice] = useState<string>("");

  const skills = useMemo(
    () =>
      [
        {
          id: "cooldown" as const,
          title: t("market.skills.cooldown.title"),
          body: t("market.skills.cooldown.body"),
          meta: t("market.skills.cooldown.meta"),
          price: 35,
        },
        {
          id: "dailyBoost" as const,
          title: t("market.skills.dailyBoost.title"),
          body: t("market.skills.dailyBoost.body"),
          meta: t("market.skills.dailyBoost.meta"),
          price: 60,
        },
        {
          id: "inputBlock" as const,
          title: t("market.skills.inputBlock.title"),
          body: t("market.skills.inputBlock.body"),
          meta: t("market.skills.inputBlock.meta"),
          price: 45,
        },
      ] satisfies Array<{
        id: SkillId;
        title: string;
        body: string;
        meta: string;
        price: number;
      }>,
    [t],
  );

  const buySkill = (skillId: SkillId, price: number, skillName: string) => {
    if (ownedSkills[skillId]) {
      return;
    }
    if (wldBalance < price) {
      setNotice(t("market.insufficient"));
      return;
    }

    setWldBalance((prev) => prev - price);
    setOwnedSkills((prev) => ({ ...prev, [skillId]: true }));
    setNotice(t("market.purchased", { skill: skillName }));
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
            <BalanceLabel>{t("market.balanceLabel")}</BalanceLabel>
            <BalanceValue>
              {wldBalance} <BalanceUnit>{t("market.balanceUnit")}</BalanceUnit>
            </BalanceValue>
          </BalanceCard>
        </HeaderRow>

        <SkillGrid>
          {skills.map((skill) => {
            const isOwned = ownedSkills[skill.id];
            const isDisabled = isOwned || wldBalance < skill.price;

            return (
              <SkillCard key={skill.id}>
                <SkillTop>
                  <SkillName>{skill.title}</SkillName>
                  <SkillPrice>{skill.price} WLD</SkillPrice>
                </SkillTop>
                <SkillBody>{skill.body}</SkillBody>
                <SkillMeta>{skill.meta}</SkillMeta>
                <BuyButton
                  type="button"
                  onClick={() => buySkill(skill.id, skill.price, skill.title)}
                  disabled={isDisabled}
                  data-owned={isOwned}
                >
                  {isOwned
                    ? t("market.owned")
                    : wldBalance < skill.price
                      ? t("market.insufficient")
                      : t("market.buy")}
                </BuyButton>
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

const BalanceUnit = styled.span`
  font-size: 12px;
  color: rgba(204, 239, 255, 0.84);
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

const BuyButton = styled.button`
  margin-top: 10px;
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
