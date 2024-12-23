import { isDev } from "./env";
import devConfig from "./appConf/dev.json";
import prodConfig from "./appConf/prod.json";
import { ChainConfig } from "interfaces/common";
import { neutronChainConfig } from "./chain";

export const bridgeNeutronChainConfig: ChainConfig = isDev()
  ? {
      ...neutronChainConfig,
      ...devConfig.bridge.neutron,
    }
  : {
      ...neutronChainConfig,
      ...prodConfig.bridge.neutron,
    };

export const bridgeTargetsChainConfig: ChainConfig[] = isDev()
  ? devConfig.bridge.targets.map((chain) => ({
      ...chain,
      denom: "uratom",
      coinDenom: "ATOM",
    }))
  : prodConfig.bridge.targets.map((chain) => ({
      ...chain,
      denom: "",
      coinDenom: "",
    }));

export const cw20Ics20Contract: string = isDev()
  ? devConfig.bridge.cw20ics20Contract
  : prodConfig.bridge.cw20ics20Contract;
