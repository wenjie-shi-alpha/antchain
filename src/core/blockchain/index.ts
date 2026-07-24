/**
 * 区块链功能导出文件
 * 提供统一的接口来访问区块链功能
 */

// 导出认证模块
export * from './auth/index.ts';
export * from './auth/types.ts';

// 导出合约模块
export * from './contract/index.ts';
export * from './contract/types.ts';

// 导出数据模块
export * from './data/index.ts';
export * from './data/types.ts';

// 导出隐私计算模块
export * from './privacy/index.ts';
export * from './privacy/types.ts';

// 导出通用类型
export * from './types.ts';

// 创建默认导出对象，提供所有区块链功能
import { BlockchainAuth } from './auth/index.ts';
import { BlockchainContract } from './contract/index.ts';
import { BlockchainData } from './data/index.ts';
import { BlockchainPrivacy } from './privacy/index.ts';
import { defaultConfig } from '../../deps.ts';

// 区块链功能聚合对象
export const blockchain = {
  auth: new BlockchainAuth(defaultConfig.blockchain),
  contract: new BlockchainContract(),
  data: new BlockchainData(),
  privacy: new BlockchainPrivacy()
};

// 默认导出区块链功能集合
export default blockchain; 