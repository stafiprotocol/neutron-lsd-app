import { ChainConfig } from "interfaces/common";
import { isDev } from "./env";
import devConfig from "./appConf/dev.json";
import prodConfig from "./appConf/prod.json";

export const neutronChainConfig: ChainConfig = isDev()
  ? devConfig.chains.neutron
  : prodConfig.chains.neutron;

export const lsdTokenChainConfig: ChainConfig = isDev()
  ? devConfig.chains.lsdTokenChain
  : prodConfig.chains.lsdTokenChain;
