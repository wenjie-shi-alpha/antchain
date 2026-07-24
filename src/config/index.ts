/**
 * 配置统一导出文件
 * 集中管理所有配置项，方便导入和维护
 */

// 从各配置模块导入
import { BlockchainConfig, defaultConfig as defaultBlockchainConfig } from './blockchain.ts';
import { tcsConfig, tcsNode } from './tcs.ts';

// 配置类型定义
export interface AppConfig {
  // 基础应用配置
  app: {
    name: string;
    version: string;
    port: number;
    host: string;
    environment: 'development' | 'production' | 'test';
    description: string;
    [key: string]: any;
  };
  
  // 区块链配置
  blockchain: BlockchainConfig;
  
  // TCS节点配置
  tcs: typeof tcsConfig & {
    nodes: typeof tcsNode;
  };
}

// 默认全局配置
export const defaultConfig: AppConfig = {
  app: {
    name: '蚂蚁链服务',
    version: '1.0.0',
    port: parseInt(Deno.env.get('PORT') || '8000'),
    host: Deno.env.get('HOST') || 'localhost',
    environment: (Deno.env.get('ENV') || 'development') as 'development' | 'production' | 'test',
    description: '提供隐私计算任务的创建、数据推送和结果获取功能'
  },
  blockchain: defaultBlockchainConfig,
  tcs: {
    ...tcsConfig,
    nodes: tcsNode
  }
};

// 重新导出子配置，方便直接引用
export * from './blockchain.ts';
export * from './tcs.ts';

// 获取全局配置实例
export function getConfig(): AppConfig {
  return defaultConfig;
}

// 默认导出配置对象
export default defaultConfig;
