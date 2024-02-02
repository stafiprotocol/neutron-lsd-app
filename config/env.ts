import appConfig from "./appConf/app.json";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import { getLsdTokenContract } from "./contract";

export function isDev() {
  return process.env.NEXT_PUBLIC_ENV !== "production";
}
