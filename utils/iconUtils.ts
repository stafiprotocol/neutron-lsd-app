import appConfig from "config/appConf/app.json";

export function getTokenIcon() {
  return appConfig.icons.tokenImg;
}

export function getLsdTokenIcon() {
  return appConfig.icons.lsdTokenImg;
}

export function getChainIcon() {
  return appConfig.icons.chainImg;
}
