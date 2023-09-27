import appConfig from "config/appConf/app.json";

export function getTokenIcon() {
  return appConfig.token.tokenImg;
}

export function getLsdTokenIcon() {
  return appConfig.token.lsdTokenImg;
}

export function getChainIcon() {
  return appConfig.token.chainImg;
}
