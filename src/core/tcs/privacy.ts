import { tcsConfig } from "../../config/tcs.ts";
import { ApiResponse } from "../../deps.ts";
import { TcsClient } from "./client.ts";
import {
  TcsAppInstance,
  TcsCreateInstanceParams,
  TcsInstanceQueryParams,
  TcsInstanceResult,
} from "./types.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TcsPrivacy {
  private readonly client: TcsClient;

  constructor(client = new TcsClient()) {
    this.client = client;
  }

  async createPrivacyInstance(
    params: TcsCreateInstanceParams = {},
  ): Promise<ApiResponse> {
    try {
      const result = await this.client.createAppInstance(params);
      return normalizeTcsResponse(result, "TCS_INSTANCE_CREATE_FAILED");
    } catch (error) {
      return toErrorResponse(error, "TCS_INSTANCE_CREATE_ERROR");
    }
  }

  async queryPrivacyInstance(
    params: TcsInstanceQueryParams,
    tenantId?: string,
  ): Promise<ApiResponse> {
    try {
      const result = await this.client.queryAppInstance(params, tenantId);
      return normalizeTcsResponse(result, "TCS_INSTANCE_QUERY_FAILED");
    } catch (error) {
      return toErrorResponse(error, "TCS_INSTANCE_QUERY_ERROR");
    }
  }

  async queryPrivacyResults(
    params: TcsInstanceQueryParams,
    tenantId?: string,
  ): Promise<ApiResponse> {
    try {
      const result = await this.client.pageQueryResults(params, tenantId);
      return normalizeTcsResponse(result, "TCS_RESULT_QUERY_FAILED");
    } catch (error) {
      return toErrorResponse(error, "TCS_RESULT_QUERY_ERROR");
    }
  }

  async sampleResultData(
    coDatasetId: string,
    tenantId?: string,
  ): Promise<ApiResponse> {
    try {
      const result = await this.client.sampleDataByCoDatasetId(
        coDatasetId,
        tenantId,
      );
      return normalizeTcsResponse(result, "TCS_SAMPLE_QUERY_FAILED");
    } catch (error) {
      return toErrorResponse(error, "TCS_SAMPLE_QUERY_ERROR");
    }
  }

  async runPrivacyInstanceToResult(
    params: TcsCreateInstanceParams = {},
  ): Promise<ApiResponse> {
    try {
      const scope = this.client.resolveScope(params);
      const created = await this.client.createAppInstance(params);
      if (!created.success || !created.data?.instanceId) {
        return normalizeTcsResponse(created, "TCS_INSTANCE_CREATE_FAILED");
      }

      const instanceId = created.data.instanceId;
      const query = { ...scope, instanceId };
      const deadline = Date.now() + tcsConfig.pollTimeoutMs;
      let current = created.data;

      while (Date.now() < deadline) {
        const queried = await this.client.queryAppInstance(
          query,
          params.tenantId,
        );
        if (!queried.success || !queried.data) {
          return normalizeTcsResponse(queried, "TCS_INSTANCE_QUERY_FAILED");
        }

        current = queried.data;
        if (current.status === "SUCCESS") {
          const result = await this.getSuccessfulResult(query, params.tenantId);
          const sample = await this.client.sampleDataByCoDatasetId(
            result.coDatasetId,
            params.tenantId,
          );
          if (!sample.success || !sample.data) {
            return normalizeTcsResponse(sample, "TCS_SAMPLE_QUERY_FAILED");
          }
          return {
            success: true,
            data: {
              instance: current,
              result,
              sampleData: sample.data,
            },
          };
        }

        if (["FAILED", "CANCEL"].includes(current.status)) {
          const diagnostics = await this.collectDiagnostics(
            query,
            params.tenantId,
            current,
          );
          return {
            success: false,
            code: "TCS_INSTANCE_FAILED",
            message: current.errorMsg ||
              summarizeDiagnosticFailedResult(diagnostics.results) ||
              `TCS instance ended with status ${current.status}`,
            data: {
              instance: summarizeInstance(current),
              ...diagnostics,
            },
          };
        }

        await sleep(tcsConfig.pollIntervalMs);
      }

      return {
        success: false,
        code: "TCS_INSTANCE_TIMEOUT",
        message:
          `TCS instance did not finish within ${tcsConfig.pollTimeoutMs}ms`,
        data: {
          instance: summarizeInstance(current),
          ...await this.collectDiagnostics(query, params.tenantId, current),
        },
      };
    } catch (error) {
      return toErrorResponse(error, "TCS_RUN_ERROR");
    }
  }

  private async getSuccessfulResult(
    params: TcsInstanceQueryParams,
    tenantId?: string,
  ): Promise<TcsInstanceResult> {
    const results = await this.client.pageQueryResults(params, tenantId);
    if (!results.success) {
      throw new Error(
        results.errorMsg || "Failed to query TCS instance results",
      );
    }

    const result =
      results.data?.dataList?.find((item) => item.status === "SUCCESS") ||
      results.data?.dataList?.[0];
    if (!result?.coDatasetId || result.status !== "SUCCESS") {
      throw new Error(
        summarizeFailedResult(results.data?.dataList) ||
          "No successful result found",
      );
    }

    return result;
  }

  private async collectDiagnostics(
    params: TcsInstanceQueryParams,
    tenantId: string | undefined,
    instance: {
      appInput?: { authDatasetIdList?: string[] };
      fullParam?: { operatorList?: Array<{ id?: string }> };
    },
  ): Promise<
    { results: Array<Record<string, unknown>>; [key: string]: unknown }
  > {
    const results = await this.client.pageQueryResults(params, tenantId).catch(
      () => undefined,
    );
    const sourceCoDatasetId = instance.appInput?.authDatasetIdList?.[0];
    const firstOperatorId = instance.fullParam?.operatorList?.find((item) =>
      item.id
    )?.id;

    const [
      execStatus,
      logFile,
      pdsPending,
      pdsPublishPending,
      pdsTodoInstancePending,
      test1Pending,
      test1PublishPending,
      test1TodoInstancePending,
      pdsAccept,
      test1Accept,
      pdsSourceDataset,
      test1SourceDataset,
      nodeStatus,
      resource,
    ] = await Promise.all([
      this.client.queryInstanceExecStatus(params, tenantId).catch((error) =>
        toCaughtDiagnostic(error)
      ),
      firstOperatorId
        ? this.client.downloadLogFile(
          {
            ...params,
            workerId: firstOperatorId,
            componentId: firstOperatorId,
          },
          tenantId,
        ).catch((error) => toCaughtDiagnostic(error))
        : undefined,
      this.client.getApprovalPendingCount("pds1Admin").catch(() => undefined),
      this.client.getApprovalInstancePendingCount(
        "pds1Admin",
        "PPC_APP_PUBLISH",
      ).catch(() => undefined),
      this.client.getApprovalInstancePendingCount("pds1Admin", "TODO").catch(
        () => undefined,
      ),
      this.client.getApprovalPendingCount("test1").catch(() => undefined),
      this.client.getApprovalInstancePendingCount(
        "test1",
        "PPC_APP_PUBLISH",
      ).catch(() => undefined),
      this.client.getApprovalInstancePendingCount("test1", "TODO").catch(() =>
        undefined
      ),
      this.client.listAcceptedApprovals("pds1Admin").catch(() => undefined),
      this.client.listAcceptedApprovals("test1").catch(() => undefined),
      sourceCoDatasetId
        ? this.client.queryLocalCoDatasetDetail(sourceCoDatasetId, "pds1Admin")
          .catch(() => undefined)
        : undefined,
      sourceCoDatasetId
        ? this.client.queryLocalCoDatasetDetail(sourceCoDatasetId, "test1")
          .catch(() => undefined)
        : undefined,
      this.client.getNodeStatus(tenantId).catch(() => undefined),
      this.client.collectResource(tenantId).catch(() => undefined),
    ]);

    return {
      execStatus: summarizeResponse(execStatus),
      logFile: summarizeResponse(logFile),
      results: results?.data?.dataList?.map(summarizeResult) || [],
      approvals: {
        pds1Admin: {
          pending: pdsPending?.data,
          publishPending: pdsPublishPending?.data,
          todoInstancePending: pdsTodoInstancePending?.data,
          acceptTodoTotal: pdsAccept?.data?.total,
        },
        test1: {
          pending: test1Pending?.data,
          publishPending: test1PublishPending?.data,
          todoInstancePending: test1TodoInstancePending?.data,
          acceptTodoTotal: test1Accept?.data?.total,
        },
      },
      sourceDataset: {
        coDatasetId: sourceCoDatasetId,
        pds1Admin: summarizeDataset(pdsSourceDataset?.data),
        test1: summarizeDataset(test1SourceDataset?.data),
      },
      nodeStatus: nodeStatus?.data ?? null,
      resource: summarizeResource(resource?.data),
    };
  }
}

function toCaughtDiagnostic(error: unknown) {
  return {
    success: false,
    errorMsg: error instanceof Error ? error.message : String(error),
  };
}

function summarizeResponse(
  response:
    | {
      success?: boolean;
      errorCode?: string | null;
      errorMsg?: string | null;
      data?: unknown;
    }
    | undefined,
): Record<string, unknown> | undefined {
  if (!response) {
    return undefined;
  }

  return {
    success: response.success,
    errorCode: response.errorCode,
    errorMsg: response.errorMsg,
    data: summarizeDiagnosticData(response.data),
  };
}

function summarizeDiagnosticData(data: unknown): unknown {
  if (data === null || data === undefined || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return { length: data.length };
  }

  const record = data as Record<string, unknown>;
  return {
    appInstanceStatus: record.appInstanceStatus,
    instanceId: record.instanceId,
    status: record.status,
    errorMsg: record.errorMsg,
  };
}

function normalizeTcsResponse<T>(
  response: {
    success: boolean;
    errorCode?: string | null;
    errorMsg?: string | null;
    data?: T;
  },
  fallbackCode: string,
): ApiResponse<T> {
  if (response.success) {
    return { success: true, data: response.data };
  }

  return {
    success: false,
    code: response.errorCode || fallbackCode,
    message: response.errorMsg || fallbackCode,
    data: response.data,
  };
}

function toErrorResponse(error: unknown, code: string): ApiResponse {
  return {
    success: false,
    code,
    message: error instanceof Error ? error.message : String(error),
  };
}

function summarizeFailedResult(
  results?: TcsInstanceResult[],
): string | undefined {
  const failed = results?.find((item) => item.errorMsg);
  return failed?.errorMsg || undefined;
}

function summarizeInstance(
  instance: Partial<TcsAppInstance>,
): Record<string, unknown> {
  return {
    projectId: instance.projectId,
    envId: instance.envId,
    appId: instance.appId,
    instanceId: instance.instanceId,
    status: instance.status,
    execTime: instance.execTime,
    errorMsg: instance.errorMsg,
    appInput: instance.appInput,
  };
}

function summarizeDiagnosticFailedResult(results: unknown): string | undefined {
  if (!Array.isArray(results)) {
    return undefined;
  }
  const failed = results.find((item) =>
    item && typeof item === "object" && "errorMsg" in item && item.errorMsg
  ) as { errorMsg?: string } | undefined;
  return failed?.errorMsg;
}

function summarizeResult(result: TcsInstanceResult): Record<string, unknown> {
  return {
    instanceId: result.instanceId,
    coDatasetId: result.coDatasetId,
    label: result.label,
    status: result.status,
    storageSize: result.storageSize,
    generationTime: result.generationTime,
    errorMsg: result.errorMsg,
  };
}

function summarizeDataset(
  dataset: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!dataset) {
    return undefined;
  }
  return {
    coDatasetId: dataset.coDatasetId,
    name: dataset.name,
    originCoDatasetScene: dataset.originCoDatasetScene,
    isFrozen: dataset.isFrozen,
    customParams: dataset.customParams,
  };
}

function summarizeResource(resource: unknown): unknown {
  if (!resource || typeof resource !== "object") {
    return resource;
  }

  const value = resource as {
    remainResource?: unknown;
    usedResource?: unknown;
    fakeUsedResource?: unknown;
  };
  return {
    usedResource: value.usedResource,
    fakeUsedResource: value.fakeUsedResource,
    remainResource: value.remainResource,
  };
}
