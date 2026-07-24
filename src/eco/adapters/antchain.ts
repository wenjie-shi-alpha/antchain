import { BlockchainContract } from "../../core/blockchain/contract/index.ts";
import { sha256 } from "../hash.ts";
import { LedgerPort } from "../ports.ts";
import { AlgorithmVersion, LedgerAnchor } from "../types.ts";

export const ECO_CONTRACT_ABI = {
  AlgorithmRegistry: {
    registerAlgorithm: "registerAlgorithm(string,string,string)",
    setAlgorithmStatus: "setAlgorithmStatus(string,string)",
  },
  EcoLabelRegistry: {
    issueLabel: "issueLabel(string,string,string,string,string,string)",
    revokeLabel: "revokeLabel(string,string)",
  },
} as const;

/**
 * AntChain call adapter. Contract deployment and ABI compatibility are an
 * operator responsibility; this code does not claim contracts are deployed.
 */
export class AntChainLedgerAdapter implements LedgerPort {
  constructor(
    private readonly contract = new BlockchainContract(),
    private readonly algorithmRegistryName =
      Deno.env.get("ECO_ALGORITHM_REGISTRY_CONTRACT") || "",
    private readonly ecoLabelRegistryName =
      Deno.env.get("ECO_LABEL_REGISTRY_CONTRACT") || "",
  ) {}

  private async call(
    contractName: string,
    contract: LedgerAnchor["contract"],
    methodSignature: string,
    values: string[],
  ): Promise<LedgerAnchor> {
    if (!contractName) {
      throw new Error(`Missing deployed ${contract} contract name`);
    }
    const response = await this.contract.callMethod({
      contractName,
      methodSignature,
      inputParamListStr: JSON.stringify(values),
      outputTypes: "[]",
      isLocalTransaction: false,
    });
    if (!response.success) {
      throw new Error(response.message || `${contract} contract call failed`);
    }
    return {
      // The legacy SDK response has no stable, typed transaction-hash field.
      // Keep this as an explicitly pending request reference until an operator
      // supplies the deployment-specific receipt mapper.
      transactionId: `pending-request-${
        (await sha256({
          contractName,
          methodSignature,
          values,
          response: response.data,
        })).slice(0, 24)
      }`,
      network: "AntChain",
      contract,
      anchoredAt: new Date().toISOString(),
      status: "PENDING",
    };
  }
  registerAlgorithm(algorithm: AlgorithmVersion): Promise<LedgerAnchor> {
    return this.call(
      this.algorithmRegistryName,
      "AlgorithmRegistry",
      ECO_CONTRACT_ABI.AlgorithmRegistry.registerAlgorithm,
      [algorithm.id, algorithm.algorithmHash, algorithm.status],
    );
  }
  setAlgorithmStatus(algorithm: AlgorithmVersion): Promise<LedgerAnchor> {
    return this.call(
      this.algorithmRegistryName,
      "AlgorithmRegistry",
      ECO_CONTRACT_ABI.AlgorithmRegistry.setAlgorithmStatus,
      [algorithm.id, algorithm.status],
    );
  }
  issueLabel(
    label: {
      labelId: string;
      taskId: string;
      algorithmId: string;
      inputHash: string;
      resultHash: string;
      evidenceHash: string;
    },
  ): Promise<LedgerAnchor> {
    return this.call(
      this.ecoLabelRegistryName,
      "EcoLabelRegistry",
      ECO_CONTRACT_ABI.EcoLabelRegistry.issueLabel,
      [
        label.labelId,
        label.taskId,
        label.algorithmId,
        label.inputHash,
        label.resultHash,
        label.evidenceHash,
      ],
    );
  }
  revokeLabel(labelId: string, reasonHash: string): Promise<LedgerAnchor> {
    return this.call(
      this.ecoLabelRegistryName,
      "EcoLabelRegistry",
      ECO_CONTRACT_ABI.EcoLabelRegistry.revokeLabel,
      [labelId, reasonHash],
    );
  }
}
