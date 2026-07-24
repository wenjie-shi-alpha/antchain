import { load } from "std/dotenv/mod.ts";

const envConfig = await load();


// 创建配置对象，优先使用环境变量，其次使用.env文件中的配置
const getConfig = (key: string, defaultValue?: string): string => {
  // 优先使用环境变量
  const envValue = Deno.env.get(key);
  if (envValue !== undefined) {
    return envValue;
  }
  // 其次使用.env文件中的值
  return envConfig[key] !== undefined ? envConfig[key] : (defaultValue || "");
};

export interface BlockchainConfig {
    restUrl: string;
    accessId: string;
    tenantId: string;
    account: string;
    bizId: string;
    kmsKeyId: string;
    contractName: string;
  }
  
  /**
   * Default configuration values
   */
  export const defaultConfig: BlockchainConfig = {
    restUrl: getConfig('BLOCKCHAIN_REST_URL'),
    accessId: getConfig('BLOCKCHAIN_ACCESS_ID'),
    tenantId: getConfig('BLOCKCHAIN_TENANT_ID'),
    account: getConfig('BLOCKCHAIN_ACCOUNT'),
    bizId: getConfig('BLOCKCHAIN_BIZ_ID'),
    kmsKeyId: getConfig('BLOCKCHAIN_KMS_KEY_ID'),
    contractName: getConfig('BLOCKCHAIN_CONTRACT_NAME')
  };

export const blockChainEndpoint = {
    contract:{
      chainCallForBiz: '/api/contract/chainCallForBiz',
      chainCall: '/api/contract/chainCall',
      shakeHand: '/api/contract/shakeHand',
    }
}
