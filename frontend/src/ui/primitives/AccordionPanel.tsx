"use client";

import styled from "@emotion/styled";
import type { ReactNode } from "react";
import { useId, useState } from "react";

export type AccordionPanelProps = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  fillWhenOpen?: boolean;
};

export default function AccordionPanel({
  title,
  children,
  defaultOpen = true,
  className,
  fillWhenOpen = false,
}: AccordionPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <Root className={className} data-open={isOpen} data-fill={fillWhenOpen}>
      <HeaderButton
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <TitleWrap>{title}</TitleWrap>
        <Indicator data-open={isOpen}>▾</Indicator>
      </HeaderButton>

      <Content id={contentId} data-open={isOpen} data-fill={fillWhenOpen}>
        {children}
      </Content>
    </Root>
  );
}

const Root = styled.section`
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const HeaderButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
`;

const TitleWrap = styled.div`
  min-width: 0;
`;

const Indicator = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(155, 227, 255, 0.46);
  background: rgba(17, 63, 100, 0.72);
  color: rgba(231, 248, 255, 0.98);
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 180ms ease;

  &[data-open="true"] {
    transform: rotate(180deg);
  }
`;

const Content = styled.div`
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition:
    max-height 220ms ease,
    opacity 180ms ease;

  &[data-open="true"] {
    max-height: 600px;
    opacity: 1;
  }

  &[data-fill="true"][data-open="true"] {
    flex: 1;
    min-height: 0;
    max-height: none;
    overflow-y: auto;
  }
`;
