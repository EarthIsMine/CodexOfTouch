declare module "@worldcoin/idkit/build/index.js" {
  import type { ComponentType } from "react";

  export type ISuccessResult = {
    proof: string;
    merkle_root: string;
    nullifier_hash: string;
    verification_level: string;
  };

  export const VerificationLevel: {
    Orb: "orb";
    Device: "device";
    SecureDocument: "secure_document";
    Document: "document";
  };

  export const IDKitWidget: ComponentType<any>;
}

