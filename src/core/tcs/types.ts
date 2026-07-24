export interface TcsResponse<T = unknown> {
  success: boolean;
  errorCode?: string | null;
  errorMsg?: string | null;
  data?: T;
}

export interface TcsPage<T> {
  dataList: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TcsInstanceScope {
  projectId: string;
  envId: string;
  appId: string;
}

export interface TcsCreateInstanceParams extends Partial<TcsInstanceScope> {
  tenantId?: string;
  dynamicParam?: string | TcsDynamicParam;
  includeDynamicParam?: boolean;
}

export interface TcsInstanceQueryParams extends TcsInstanceScope {
  instanceId: string;
}

export interface TcsAppInstance {
  projectId: string;
  envId: string;
  appId: string;
  instanceId: string;
  status: "INIT" | "EXECUTING" | "SUCCESS" | "FAILED" | "CANCEL" | string;
  execTime?: number;
  errorMsg?: string | null;
  appInput?: {
    authDatasetIdList?: string[];
    resultDatasetIdList?: string[];
    openDatasetIdList?: string[];
  };
  fullParam?: TcsStaticParam;
  resultInfoList?: TcsInstanceResult[];
}

export interface TcsAppDefinition extends TcsInstanceScope {
  name?: string;
  status?: string;
  staticParam?: TcsStaticParam | string | null;
}

export interface TcsStaticParam {
  version?: string;
  fullParameter?: string;
  operatorList?: TcsStaticOperator[];
  graph?: string;
  [key: string]: unknown;
}

export interface TcsStaticOperator {
  code?: string;
  id?: string;
  meta?: unknown;
  staticParameter?: unknown;
  [key: string]: unknown;
}

export interface TcsDynamicParam {
  dynamicParameter: string;
  operatorList: TcsDynamicOperator[];
}

export interface TcsDynamicOperator {
  code?: string;
  id?: string;
  meta: string;
  dynamicParameter: string;
}

export interface TcsInstanceResult {
  projectId?: string;
  envId?: string;
  appId?: string;
  instanceId: string;
  coDatasetId: string;
  appName?: string;
  label?: string;
  storageSize?: number;
  type?: string;
  status: "INIT" | "SUCCESS" | "FAILED" | string;
  errorMsg?: string | null;
  generationTime?: number;
}

export interface TcsSampleData {
  rowSize?: number;
  colSize?: number;
  header?: string[];
  data?: unknown[][];
  [key: string]: unknown;
}

export interface TcsApprovalItem {
  id?: string;
  approvalId?: string;
  processId?: string;
  briefGroup?: string;
  status?: string;
  title?: string;
  [key: string]: unknown;
}

export interface TcsCoDatasetDetail {
  coDatasetId: string;
  originCoDatasetScene?: string;
  name?: string;
  customParams?: string;
  [key: string]: unknown;
}

export interface TcsPrivacyRunResult {
  instance: TcsAppInstance;
  result: TcsInstanceResult;
  sampleData: TcsSampleData;
}
