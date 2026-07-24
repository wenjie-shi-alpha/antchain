import {
  AlgorithmVersion,
  CalculationEvidence,
  CalculationResult,
  LedgerAnchor,
  ProductData,
} from "./types.ts";

export interface SandboxExecutionRequest {
  taskId: string;
  product: ProductData;
  algorithm: AlgorithmVersion;
}

export interface SandboxExecution {
  result: CalculationResult;
  evidence: CalculationEvidence;
}

/**
 * Port for a confidential execution environment. Implementations may be a
 * deterministic local sandbox (development) or an approved TCS workflow.
 */
export interface SandboxPort {
  execute(request: SandboxExecutionRequest): Promise<SandboxExecution>;
}

/**
 * Port for the two on-chain business registries. It accepts commitments only:
 * no ProductData or raw metric inputs may cross this boundary.
 */
export interface LedgerPort {
  registerAlgorithm(algorithm: AlgorithmVersion): Promise<LedgerAnchor>;
  setAlgorithmStatus(algorithm: AlgorithmVersion): Promise<LedgerAnchor>;
  issueLabel(label: {
    labelId: string;
    taskId: string;
    algorithmId: string;
    inputHash: string;
    resultHash: string;
    evidenceHash: string;
  }): Promise<LedgerAnchor>;
  revokeLabel(labelId: string, reasonHash: string): Promise<LedgerAnchor>;
}
