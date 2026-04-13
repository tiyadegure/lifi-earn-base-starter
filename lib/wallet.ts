"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { baseChain } from "./chains";

export const wagmiConfig = createConfig({
  chains: [baseChain],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [baseChain.id]: http(),
  },
  ssr: true,
});
