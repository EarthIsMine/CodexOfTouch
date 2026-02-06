"use client";

import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

type ToastMessageProps = {
  message: string;
};

export default function ToastMessage({ message }: ToastMessageProps) {
  return <Toast>{message}</Toast>;
}

const toastIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

const Toast = styled.div`
  position: fixed;
  left: 50%;
  bottom: calc(124px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 40;
  width: 60vw;
  padding: 20px 18px;
  border-radius: 14px;
  border: 1px solid rgba(132, 227, 255, 0.36);
  background: rgba(6, 34, 66, 0.92);
  color: rgba(235, 250, 255, 0.98);
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  pointer-events: none;
  animation: ${toastIn} 240ms ease-out;
  animation-fill-mode: both;
`;
