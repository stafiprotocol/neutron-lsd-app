import appConfig from "config/appConf/app.json";
import { getEvmChainId } from "config/env";
import { bscTestnet, bsc, mainnet } from "wagmi/chains";

export function getTokenName() {
  return appConfig.token.tokenName;
}

export function getLsdTokenName() {
  return appConfig.token.lsdTokenName;
}

export function getTokenDecimals() {
  return appConfig.token.tokenDecimals;
}

export function getAppTitle() {
  return appConfig.appTitle;
}

export function getSupportChains() {
  return appConfig.token.supportChains;
}

export function getTokenStandard() {
  return appConfig.token.tokenStandard;
}

export function getTokenChainName() {
  return appConfig.token.tokenChainName;
}

export function getDetailInfoListedIns() {
  return appConfig.detailedInfo.listedIns;
}

export function getDetailInfoAudit() {
  return appConfig.detailedInfo.audit;
}

export interface IFaqContent {
  type: string;
  content: string;
  link?: string;
}
export interface IFaqItem {
  title: string;
  contents: IFaqContent[];
}

export function getFaqList(): IFaqItem[] {
  return appConfig.faqList;
}

export function getUnstakeTipLink() {
  return appConfig.unstake.lockTipLink;
}

export function getAuditList() {
  return appConfig.auditList;
}

export function getTokenPriceUrl() {
  return appConfig.tokenPriceUrl;
}

export function getDefaultApr() {
  return appConfig.apr;
}

export function getContactList() {
  return appConfig.contactList;
}

export function getExternalLinkList() {
  return appConfig.externalLinkList;
}

export function getWagmiNetwork() {
  if (getEvmChainId() === 97) {
    return bscTestnet;
  } else if (getEvmChainId() === 56) {
    return bsc;
  }
  return mainnet;
}
