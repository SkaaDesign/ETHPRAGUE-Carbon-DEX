"use client";

// Always-visible wallet status pill — top-right, sibling to LiveBadge.
//
// Renders the RainbowKit ConnectButton in a compact form regardless of
// whether the route is in live or sim mode. Without this, the only
// Connect surface was inside the action panels — which only render in
// live mode — so an RPC failure on first load would lock the user out
// of ever connecting a wallet to retry.
//
// Visible on /regulator and /company. Skipped on /public (read-only).

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function HeaderWalletStatus() {
  return (
    <ConnectButton
      showBalance={false}
      accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
      chainStatus={{ smallScreen: "icon", largeScreen: "icon" }}
    />
  );
}
