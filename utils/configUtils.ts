import appConfig from "config/appConf/app.json";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";

export function getTokenName() {
  return lsdTokenChainConfig.coinDenom;
}

export function getLsdTokenName() {
  return lsdTokenChainConfig.lsdTokenName;
}

export function getAppTitle() {
  return appConfig.appTitle;
}

export function getSupportChains() {
  return appConfig.chain.supportChains;
}

export function getTokenChainName() {
  return neutronChainConfig.chainName;
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

export function getAuditList() {
  return appConfig.auditList;
}

export function getTokenPriceUrl() {
  return appConfig.tokenPriceUrl;
}

export function getDefaultApr() {
  return lsdTokenChainConfig.defaultApr;
}

export function getContactList() {
  return appConfig.contactList;
}

export function getExternalLinkList() {
  return appConfig.externalLinkList;
}

export function supportLiquidStake() {
  return lsdTokenChainConfig.coinDenom === "ATOM";
}
