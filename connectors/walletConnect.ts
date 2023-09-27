import { createPublicClient, http } from "viem";
import { configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { getWagmiNetwork } from "utils/configUtils";

const wagmiNetwork = getWagmiNetwork();

export const viemClient = createPublicClient({
  chain: wagmiNetwork,
  transport: http(),
});

const customChains = [wagmiNetwork];
const { publicClient, chains } = configureChains(customChains, [
  publicProvider(),
]);
export const wagmiConfig = createConfig({
  autoConnect: false,
  connectors: [
    new MetaMaskConnector({
      chains,
    }),
  ],
  publicClient,
});
