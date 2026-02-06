"use client";

import {
  IDKitWidget,
  VerificationLevel,
  type ISuccessResult,
} from "@worldcoin/idkit/build/index.js";
import { useState } from "react";
import CTAButton from "@/ui/primitives/CTAButton";

type WorldIdVerifyButtonProps = {
  label: string;
  verifyingLabel: string;
  disabled?: boolean;
  onVerified: () => void;
  onError: (message: string) => void;
  missingConfigMessage: string;
};

export default function WorldIdVerifyButton({
  label,
  verifyingLabel,
  disabled = false,
  onVerified,
  onError,
  missingConfigMessage,
}: WorldIdVerifyButtonProps) {
  const [pending, setPending] = useState(false);
  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
  const action = process.env.NEXT_PUBLIC_WORLDCOIN_ACTION;
  const isConfigured = Boolean(appId && action);

  const handleVerify = async (proof: ISuccessResult) => {
    setPending(true);
    try {
      const response = await fetch("/api/dev/worldid-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proof }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: {
          token?: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.data?.token) {
        throw new Error(payload.error || "World ID authentication failed.");
      }
    } finally {
      setPending(false);
    }
  };

  if (!isConfigured) {
    return (
      <CTAButton
        variant="brand"
        disabled={disabled || pending}
        onClick={() => onError(missingConfigMessage)}
      >
        {pending ? verifyingLabel : label}
      </CTAButton>
    );
  }

  return (
    <IDKitWidget
      app_id={appId as `app_${string}`}
      action={action as string}
      verification_level={VerificationLevel.Orb}
      handleVerify={handleVerify}
      onSuccess={onVerified}
      onError={(error: { message?: string }) =>
        onError(error.message || "World ID verification failed.")
      }
    >
      {({ open }: { open: () => void }) => (
        <CTAButton variant="brand" disabled={disabled || pending} onClick={open}>
          {pending ? verifyingLabel : label}
        </CTAButton>
      )}
    </IDKitWidget>
  );
}
