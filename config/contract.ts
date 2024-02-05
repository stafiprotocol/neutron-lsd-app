import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import { isDev } from "./env";

/**
 * get neutron stakeManager contract address
 */
export function getStakeManagerContract() {
  if (isDev()) {
    return appDevConfig.stakeManagerContract;
  }
  return appProdConfig.stakeManagerContract;
}

/**
 * get neutron poolAddress
 */
export function getPoolAddress() {
  if (isDev()) {
    return appDevConfig.poolAddress;
  }
  return appProdConfig.poolAddress;
}
