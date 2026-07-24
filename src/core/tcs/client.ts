import { encodeBase64 } from "../../deps.ts";
import { TcsConfig, tcsConfig } from "../../config/tcs.ts";
import {
  TcsAppDefinition,
  TcsAppInstance,
  TcsApprovalItem,
  TcsCoDatasetDetail,
  TcsCreateInstanceParams,
  TcsDynamicParam,
  TcsInstanceQueryParams,
  TcsInstanceResult,
  TcsInstanceScope,
  TcsPage,
  TcsResponse,
  TcsSampleData,
  TcsStaticParam,
} from "./types.ts";

type QueryValue = string | number | boolean | undefined | null;

export interface TcsRequestOptions {
  tenantId?: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  timeoutMs?: number;
}

export class TcsClient {
  private readonly config: TcsConfig;

  constructor(config: Partial<TcsConfig> = {}) {
    this.config = { ...tcsConfig, ...config };
  }

  resolveScope(params: Partial<TcsInstanceScope> = {}): TcsInstanceScope {
    const projectId = params.projectId || this.config.defaultProjectId;
    const envId = params.envId || this.config.defaultEnvId;
    const appId = params.appId || this.config.defaultAppId;

    if (!projectId || !envId || !appId) {
      throw new Error("Missing TCS projectId, envId, or appId");
    }

    return { projectId, envId, appId };
  }

  async createAppInstance(
    params: TcsCreateInstanceParams = {},
  ): Promise<TcsResponse<TcsAppInstance>> {
    const scope = this.resolveScope(params);
    const body = await this.buildCreateInstanceBody(scope, params);
    return await this.request<TcsAppInstance>(
      "POST",
      "/api/app/instance/create",
      {
        tenantId: params.tenantId,
        body,
      },
    );
  }

  async queryAppDefinition(
    params: Partial<TcsInstanceScope> = {},
    tenantId?: string,
  ): Promise<TcsResponse<TcsAppDefinition>> {
    const scope = this.resolveScope(params);
    return await this.request<TcsAppDefinition>("GET", "/api/app/query", {
      tenantId,
      query: { ...scope },
    });
  }

  async queryAppInstance(
    params: TcsInstanceQueryParams,
    tenantId?: string,
  ): Promise<TcsResponse<TcsAppInstance>> {
    return await this.request<TcsAppInstance>(
      "GET",
      "/api/app/instance/query",
      {
        tenantId,
        query: { ...params },
      },
    );
  }

  async queryInstanceExecStatus(
    params: Partial<TcsInstanceScope> & { instanceId?: string } = {},
    tenantId?: string,
  ): Promise<TcsResponse<unknown>> {
    const scope = this.resolveScope(params);
    return await this.request<unknown>(
      "GET",
      "/api/app/instance/queryInstanceExecStatus",
      {
        tenantId,
        query: { ...scope, instanceId: params.instanceId },
        timeoutMs: 15000,
      },
    );
  }

  async downloadLogFile(
    params: TcsInstanceQueryParams & { workerId: string; componentId: string },
    tenantId?: string,
  ): Promise<TcsResponse<unknown>> {
    return await this.request<unknown>(
      "GET",
      "/api/app/instance/downloadLogFile",
      {
        tenantId,
        query: { ...params },
        timeoutMs: 15000,
      },
    );
  }

  async pageQueryResults(
    params: TcsInstanceQueryParams & { page?: number; pageSize?: number },
    tenantId?: string,
  ): Promise<TcsResponse<TcsPage<TcsInstanceResult>>> {
    return await this.request<TcsPage<TcsInstanceResult>>(
      "GET",
      "/api/app/instance/result/pageQuery",
      {
        tenantId,
        query: { page: 1, pageSize: 10, ...params },
      },
    );
  }

  async sampleDataByCoDatasetId(
    coDatasetId: string,
    tenantId?: string,
  ): Promise<TcsResponse<TcsSampleData>> {
    return await this.request<TcsSampleData>(
      "POST",
      "/api/dataset/io/sampleDataByCoDatasetId",
      {
        tenantId,
        body: { coDatasetId },
      },
    );
  }

  async queryLocalCoDatasetDetail(
    coDatasetId: string,
    tenantId?: string,
  ): Promise<TcsResponse<TcsCoDatasetDetail>> {
    return await this.request<TcsCoDatasetDetail>(
      "GET",
      "/api/local/codataset/queryDetail",
      {
        tenantId,
        query: { coDatasetId },
      },
    );
  }

  async getApprovalPendingCount(
    tenantId?: string,
  ): Promise<TcsResponse<number>> {
    return await this.request<number>("GET", "/api/approval/pending/count", {
      tenantId,
    });
  }

  async getApprovalInstancePendingCount(
    tenantId?: string,
    briefGroup?: string,
  ): Promise<TcsResponse<number>> {
    return await this.request<number>(
      "GET",
      "/api/approval/instance/pending/count",
      { tenantId, query: { briefGroup } },
    );
  }

  async listAcceptedApprovals(
    tenantId?: string,
    briefGroup = "TODO",
  ): Promise<TcsResponse<TcsPage<TcsApprovalItem>>> {
    return await this.request<TcsPage<TcsApprovalItem>>(
      "GET",
      "/api/approval/accept/list",
      {
        tenantId,
        query: { page: 1, pageSize: 10, briefGroup },
      },
    );
  }

  async listInitiatedApprovals(
    tenantId?: string,
    briefGroup = "TODO",
  ): Promise<TcsResponse<TcsPage<TcsApprovalItem>>> {
    return await this.request<TcsPage<TcsApprovalItem>>(
      "GET",
      "/api/approval/initiate/list",
      {
        tenantId,
        query: { page: 1, pageSize: 10, briefGroup },
      },
    );
  }

  async getNodeStatus(tenantId?: string): Promise<TcsResponse<unknown>> {
    return await this.request<unknown>("GET", "/api/node/getNodeStatus", {
      tenantId,
    });
  }

  async collectResource(
    tenantId?: string,
    currentType = "NODE",
  ): Promise<TcsResponse<unknown>> {
    return await this.request<unknown>("GET", "/api/resource/collect", {
      tenantId,
      query: { currentType },
    });
  }

  async request<T>(
    method: string,
    path: string,
    options: TcsRequestOptions = {},
  ): Promise<TcsResponse<T>> {
    const url = new URL(path, this.config.restUrl);
    for (const [key, value] of Object.entries(options.query || {})) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    const bodyText = options.body === undefined
      ? undefined
      : JSON.stringify(options.body);
    const signedHeaders = await this.buildSignedHeaders(
      url,
      bodyText,
      options.tenantId,
    );
    const headers: Record<string, string> = { ...signedHeaders };
    if (bodyText !== undefined) {
      headers["content-type"] = "application/json;charset=UTF-8";
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 30000,
    );

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyText,
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await response.json();
      }

      const text = await response.text();
      return {
        success: response.ok,
        errorCode: response.ok ? null : String(response.status),
        errorMsg: text,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async buildSignedHeaders(
    url: URL,
    bodyText = "",
    tenantId = this.config.tenantId,
  ): Promise<Record<string, string>> {
    if (!this.config.isvAk || !this.config.isvSk) {
      throw new Error("Missing ISV_APIAUTH_AK or ISV_APIAUTH_SK");
    }

    const headers: Record<string, string> = {
      "x-tenant-id": tenantId,
      "x-authentication-version": this.config.authenticationVersion,
      "x-authentication-type": this.config.authenticationType,
      "x-signature-method": this.config.signatureMethod,
      "x-isv-ak": this.config.isvAk,
    };

    const query: Record<string, string> = {};
    for (const name of new Set(url.searchParams.keys())) {
      query[name] = url.searchParams.getAll(name).join(",");
    }

    const signatureContent = `${url.pathname}${connectParamMap(headers)}${
      connectParamMap(query)
    }${bodyText}`;
    headers["x-signature"] = await hmacSha256Base64(
      this.config.isvSk,
      signatureContent,
    );
    return headers;
  }

  private async buildCreateInstanceBody(
    scope: TcsInstanceScope,
    params: TcsCreateInstanceParams,
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { ...scope };

    if (params.dynamicParam !== undefined) {
      body.dynamicParam = stringifyDynamicParam(params.dynamicParam);
      return body;
    }

    if (params.includeDynamicParam === false) {
      return body;
    }

    const app = await this.queryAppDefinition(scope, params.tenantId);
    const dynamicParam = buildDynamicParamFromStaticParam(
      app.data?.staticParam,
    );
    if (dynamicParam) {
      body.dynamicParam = JSON.stringify(dynamicParam);
    }
    return body;
  }
}

export function connectParamMap(params: Record<string, string>): string {
  return Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join(
    "&",
  );
}

export async function hmacSha256Base64(
  secret: string,
  content: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(content),
  );
  return encodeBase64(new Uint8Array(signature));
}

export function buildDynamicParamFromStaticParam(
  staticParam: TcsStaticParam | string | null | undefined,
): TcsDynamicParam | undefined {
  const parsed = parseJsonObject<TcsStaticParam>(staticParam, {});
  const operatorList = parsed.operatorList;
  if (!Array.isArray(operatorList)) {
    return undefined;
  }

  return {
    dynamicParameter: "",
    operatorList: operatorList.map((operator) => ({
      code: operator.code,
      id: operator.id,
      meta: JSON.stringify(parseJsonObject(operator.meta, {})),
      dynamicParameter: JSON.stringify(
        parseJsonObject(operator.staticParameter, {}),
      ),
    })),
  };
}

function stringifyDynamicParam(dynamicParam: string | TcsDynamicParam): string {
  return typeof dynamicParam === "string"
    ? dynamicParam
    : JSON.stringify(dynamicParam);
}

function parseJsonObject<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
