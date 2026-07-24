import { load } from "std/dotenv/mod.ts";

const envConfig = await load();

const getConfig = (key: string, defaultValue = ""): string => {
  const envValue = Deno.env.get(key);
  if (envValue !== undefined) {
    return envValue;
  }
  return envConfig[key] !== undefined ? envConfig[key] : defaultValue;
};

export interface TcsConfig {
  restUrl: string;
  isvAk: string;
  isvSk: string;
  tenantId: string;
  authenticationType: "isv";
  authenticationVersion: "1.0";
  signatureMethod: "SHA256_HMAC";
  defaultProjectId: string;
  defaultEnvId: string;
  defaultAppId: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

export const tcsNode = [
  getConfig("TCS_REST_URL", "http://123.57.86.188:32081"),
];

export const tcsConfig: TcsConfig = {
  restUrl: getConfig("TCS_REST_URL", "http://123.57.86.188:32081"),
  isvAk: getConfig("ISV_APIAUTH_AK"),
  isvSk: getConfig("ISV_APIAUTH_SK"),
  tenantId: getConfig("TCS_TENANT_ID", "pds1Admin"),
  authenticationType: "isv",
  authenticationVersion: "1.0",
  signatureMethod: "SHA256_HMAC",
  defaultProjectId: getConfig("TCS_PROJECT_ID", "PROJ_20250320113805_e9T7iO8S"),
  defaultEnvId: getConfig("TCS_ENV_ID", "ENV_20250320113805_uoZI9ZdP"),
  defaultAppId: getConfig("TCS_APP_ID", "APP_20250320181026_yf0vuAct"),
  pollIntervalMs: Number(getConfig("TCS_POLL_INTERVAL_MS", "5000")),
  pollTimeoutMs: Number(getConfig("TCS_POLL_TIMEOUT_MS", "600000")),
};
