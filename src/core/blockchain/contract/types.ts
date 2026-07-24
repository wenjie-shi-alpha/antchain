/**
 * Types for contract operations
 */

/**
 * Interface for contract method parameters
 */
export interface ContractMethodParams {
  contractName: string;
  methodSignature: string;
  inputParams?: any[];
  outputTypes?: string;
  isLocalTransaction?: boolean;
  // WASM合约专用参数
  inputParamListStr?: string; // 传递字符串化的参数数组
  outTypes?: string; // 传递字符串化的输出类型
  orderId?: string; // 唯一请求ID
  mykmsKeyId?: string;
  tenantid?: string;
  withGasHold?: boolean;
  gas?: number;
}

/**
 * Contract deployment parameters
 */
export interface ContractDeployParams {
  contractName: string;
  contractCode: string;
  constructorParams?: any[];
  sourceCodeType?: 'SOLIDITY' | 'RUST' | 'GO';
} 