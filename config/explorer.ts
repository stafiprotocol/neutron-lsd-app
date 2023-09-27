import { isDev } from "./env";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";

export function getExplorerUrl() {
  if (isDev()) {
    return appDevConfig.explorer;
  }
  return appProdConfig.explorer;
}

export function getExplorerTxUrl(txHash: string | undefined) {
  if (isDev()) {
    return `${getExplorerUrl()}/tx/${txHash}`;
  }
  return `${getExplorerUrl()}/tx/${txHash}`;
}

export function getExplorerAccountUrl(account: string) {
  if (isDev()) {
    return `${getExplorerUrl()}/address/${account}`;
  }
  return `${getExplorerUrl()}/address/${account}`;
}

export function getExplorerTokenTxUrl(address: any) {
  if (isDev()) {
    return `${getExplorerUrl()}/address/${address}#tokentxns`;
  }
  return `${getExplorerUrl()}/address/${address}#tokentxns`;
}
