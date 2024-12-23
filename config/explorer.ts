import { isDev } from "./env";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import { lsdTokenChainConfig, neutronChainConfig } from "./chain";
import { bridgeTargetsChainConfig } from "./bridge";

export function getExplorerUrl(chainId?: string) {
  if (chainId === lsdTokenChainConfig.chainId) {
    return lsdTokenChainConfig.explorerUrl;
  }
  return neutronChainConfig.explorerUrl;
}

export function getExplorerTxUrl(txHash: string | undefined, chainId?: string) {
  if (isDev()) {
    return `${getExplorerUrl(chainId)}/tx/${txHash}`;
  }
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export function getExplorerAccountUrl(account: string, chainId?: string) {
  if (isDev()) {
    return `${getExplorerUrl(chainId)}/address/${account}`;
  }
  return `${getExplorerUrl(chainId)}/address/${account}`;
}

export function getExplorerTokenTxUrl(address: any, chainId?: string) {
  if (isDev()) {
    return `${getExplorerUrl(chainId)}/address/${address}#tokentxns`;
  }
  return `${getExplorerUrl(chainId)}/address/${address}#tokentxns`;
}

export function getBridgeTargetChainExplorerUrl(chainId: string) {
  const chainConfig = bridgeTargetsChainConfig.find(
    (conf) => conf.chainId === chainId
  );
  return chainConfig?.explorerUrl || "";
}

export function getBridgeTargetChainExplorerTxUrl(
  chainId: string,
  txHash: string
) {
  return `${getBridgeTargetChainExplorerUrl(chainId)}/tx/${txHash}`;
}
