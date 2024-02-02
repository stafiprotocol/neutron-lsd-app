import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import { isDev } from "./env";

/**
 * get neutron lsdToken contract address
 */
export function getLsdTokenContract() {
  if (isDev()) {
    return appDevConfig.contracts.lsdToken.address;
  }
  return appProdConfig.contracts.lsdToken.address;
}

/**
 * get neutron stakeManager contract address
 */
export function getStakeManagerContract() {
  if (isDev()) {
    return appDevConfig.contracts.stakeManager.address;
  }
  return appProdConfig.contracts.stakeManager.address;
}

/**
 * get neutron poolAddress
 */
export function getPoolAddress() {
  if (isDev()) {
    return appDevConfig.contracts.poolAddress.address;
  }
  return appProdConfig.contracts.poolAddress.address;
}
