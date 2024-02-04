import { ChainConfig } from "interfaces/common";
import { isDev } from "./env";
import chainDevConfig from "./chain/dev.json";
import chainProdConfig from "./chain/prod.json";

export const neutronChainConfig: ChainConfig = isDev()
  ? chainDevConfig.neutron
  : chainProdConfig.neutron;

export const lsdTokenChainConfig: ChainConfig = isDev()
  ? chainDevConfig.lsdTokenChain
  : chainProdConfig.lsdTokenChain;
