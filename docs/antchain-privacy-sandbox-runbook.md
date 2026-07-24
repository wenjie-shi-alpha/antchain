# AntChain Privacy Computing and Sandbox Runbook

Last verified: 2026-07-24 (Asia/Shanghai)

This document records the AntChain node addresses, authentication rules,
resource and role requirements, API payloads, successful end-to-end runs, and
known failure modes verified against the current deployment.

Secrets are intentionally not committed to this file. Full local credentials
are stored in:

- `.env`: node ISV AK/SK used by the project.
- `.codex-local/antchain-platform-secrets.key`: consolidated local credentials.
- `.codex-local/sandbox-api-0724.key`: the created sandbox tenant credentials.

Files under `.codex-local` use mode `600` and the `.key` extension is ignored by
Git.

## 1. Platform Topology

| Surface | Node ID | Base URL | Verified tenants |
| --- | --- | --- | --- |
| Circulation island | `TTN01` | `http://123.57.145.236:32080` | `ccAdmin`, `test`, `sandboxApi0724` |
| Collaboration node | `TTN02` | `http://123.57.86.188:32081` | `pds1Admin`, `test1` |
| Legacy blockchain gateway | - | `http://123.57.145.236:8088` | Not the TCS privacy/sandbox API |

The same node-level `ISV_APIAUTH_AK/SK` pair is accepted on both UI nodes, but
the requested `x-tenant-id` must belong to the node addressed by the URL.

Examples:

- `32080` + `x-tenant-id: sandboxApi0724`: accepted.
- `32080` + `x-tenant-id: pds1Admin`: rejected.
- `32081` + `x-tenant-id: pds1Admin`: accepted.
- `32081` + `x-tenant-id: sandboxApi0724`: rejected.

This means the ISV credential is node/integration scoped, not an AccessKey
owned by one UI user.

## 2. Authentication

### 2.1 ISV API authentication

The privacy-computing and sandbox project APIs use HMAC-SHA256 ISV
authentication.

Required headers:

```text
x-tenant-id: <tenant ID on the target node>
x-authentication-version: 1.0
x-authentication-type: isv
x-signature-method: SHA256_HMAC
x-isv-ak: <ISV_APIAUTH_AK>
x-signature: <base64 HMAC-SHA256 signature>
```

Canonical signature content:

```text
encodedPath
+ sortedHeaderPairs
+ sortedQueryPairs
+ rawRequestBody
```

Each map is encoded as sorted `key=value` items joined with `&`. Repeated query
values are joined with commas. The signature is:

```text
base64(hmac_sha256(ISV_APIAUTH_SK, canonicalContent))
```

For JSON requests, sign the exact serialized JSON body sent over the wire.

The implementation is in:

- `src/core/tcs/client.ts`
- `js/sign.java`

### 2.2 Account AccessKey is different

The UI path `Account Settings -> AccessKey` creates account-level credentials
whose IDs start with `PDS`.

Verified examples:

- `ccAdmin` AccessKey belongs to `TTN01/ccAdmin`.
- `sandboxApi0724` AccessKey belongs to `TTN01/sandboxApi0724`.

These account AccessKeys are not interchangeable with `ISV_APIAUTH_AK/SK`.
Using a `PDS...` AccessKey as `x-isv-ak` returns:

```text
Invalid request: invalid isv ak
```

The UI only exposes the AccessKey Secret once. Download `AccessKey.csv` before
closing the creation dialog. The CSV fields are:

```text
nodeId,tenantId,user,accessKeyId,accessKeySecret
```

## 3. Verified Sandbox Tenant

Created through the circulation-island `ccAdmin` tenant-management UI:

```text
tenantId: sandboxApi0724
tenant name: sandbox-api-0724
admin login: sandboxApi0724
nodeId: TTN01
```

The password and account AccessKey are in the private credential files listed
at the top of this document.

Resources assigned at tenant creation:

```text
Privacy computing: 4 CPU, 8 GB memory, 10 GB storage
Sandbox computing: 4 CPU, 4 GB memory, 10 GB storage
Other storage: 2 GB
```

Verified sandbox resource query:

```http
GET /api/resource/collect
  ?currentType=TENANT_SANDBOX
  &currentId=sandboxApi0724
  &tenantId=sandboxApi0724
```

Result:

```text
remaining CPU: 4
remaining memory: 4 GB
remaining storage: 10,000,000,000 bytes
```

## 4. Sandbox Project Creation

### 4.1 Required lookup calls

List project roles:

```http
GET /api/project/party/getDefaultPartyRoleList
```

Relevant role IDs:

```text
default_tenant_to_project_data_provider
default_tenant_to_project_data_consumer
default_tenant_to_project_project_admin
default_tenant_to_project_system_admin
```

List network tenants and obtain their DIDs:

```http
GET /api/network/getNetworkTenantList?page=1&pageSize=1000
```

Verified `TTN01` parties:

```text
test
did:private:0000:f0f0e50135471d4a0e59663c50d4b8c11a195848de86d48ba6562ac044059374

sandboxApi0724
did:private:0000:09ecb58f4f98b80cc9f2f05190ed23e9af12927a6f20717baa38f27430e16e9d

ccAdmin
did:private:0000:803476a9300ffe6e9f33f65bbcce2d4adb1f35965d0060402aafcc0863f8e0af
```

All sandbox project participants must be sandbox-node tenants. A request using
`pds1Admin/test1` from `TTN02` reached the business validation layer but failed
with:

```text
Sandbox projects cannot contain non-sandbox-node tenants.
```

Their `TENANT_SANDBOX` CPU, memory, and storage were all zero.

### 4.2 Create request

Endpoint:

```http
POST /api/project/create
```

Verified request body:

```json
{
  "name": "api-sandbox-20260724-verify",
  "projectType": "SANDBOX",
  "editType": "SPARK_SQL",
  "coSceneType": "SAFE_STATISTIC",
  "partyRoleList": [
    {
      "roleId": "default_tenant_to_project_data_provider",
      "partyDidList": [
        "did:private:0000:f0f0e50135471d4a0e59663c50d4b8c11a195848de86d48ba6562ac044059374"
      ]
    },
    {
      "roleId": "default_tenant_to_project_data_consumer",
      "partyDidList": [
        "did:private:0000:09ecb58f4f98b80cc9f2f05190ed23e9af12927a6f20717baa38f27430e16e9d"
      ]
    },
    {
      "roleId": "default_tenant_to_project_project_admin",
      "partyDidList": [
        "did:private:0000:09ecb58f4f98b80cc9f2f05190ed23e9af12927a6f20717baa38f27430e16e9d"
      ]
    }
  ],
  "projectResource": {
    "version": "0.0.1",
    "resourceVOMap": {
      "EXPERIMENT_SANDBOX": {
        "cpu": 1,
        "memory": 1,
        "storage": 0
      },
      "PRODUCTION_SANDBOX": {
        "cpu": 1,
        "memory": 1,
        "storage": 0
      }
    }
  }
}
```

Use:

```text
base URL: http://123.57.145.236:32080
x-tenant-id: sandboxApi0724
```

### 4.3 Successful project

```text
project name: api-sandbox-20260724-verify
project ID: PROJ_20260724141253_JjsSETbu
project type: SANDBOX
edit type: SPARK_SQL
scene: SAFE_STATISTIC
owner: sandbox-api-0724
total resource: 2 CPU, 2 GB memory
```

Environments:

```text
EXPERIMENT_SANDBOX
ENV_20260724141253_9ZbBjBre
1 CPU, 1 GB memory

PRODUCTION_SANDBOX
ENV_20260724141253_03rwxwi4
1 CPU, 1 GB memory
```

Members:

```text
sandboxApi0724: project administrator + data consumer
test: data provider
ccAdmin: system-added super administrator
```

Verify creation:

```http
GET /api/project/get?projectId=PROJ_20260724141253_JjsSETbu
GET /api/project/list?projectTypes=SANDBOX
GET /api/project/party/pageQuery
  ?projectId=PROJ_20260724141253_JjsSETbu
  &page=1
  &pageSize=100
```

## 5. Sandbox Application Operations

### 5.1 Supported project modes

The create-project frontend maps:

```text
SAFE_STATISTIC -> SPARK_SQL
SAFE_MODELING  -> PYTHON
```

The verified project is `SAFE_STATISTIC/SPARK_SQL`.

### 5.2 Create an application

Endpoint:

```http
POST /api/app/create
```

Verified body shape:

```json
{
  "projectId": "PROJ_20260724141253_JjsSETbu",
  "envId": "ENV_20260724141253_9ZbBjBre",
  "staticParam": "{\"codeDetail\":\"SELECT ...\",\"customParams\":{}}",
  "appType": "SANDBOX",
  "editType": "SPARK_SQL",
  "name": "api-sandbox-select-1",
  "computeMode": "OFFLINE",
  "coSceneType": "SAFE_STATISTIC"
}
```

Created application:

```text
app ID: APP_20260724141525_I58U6E6W
name: api-sandbox-select-1
edit type: SPARK_SQL
```

### 5.3 Workbench operations

The experiment sandbox workbench exposes:

- Browse authorized data:
  - own data
  - collaborator data
  - data-catalog data
- Browse prior computation results.
- Edit and format Spark SQL.
- Save the current application.
- Save as a new application/version.
- Run static security analysis.
- Pre-execute in the experiment sandbox.
- View execution records.
- View security-analysis results.
- Publish to the production sandbox.

Python safe-modeling projects additionally expose custom parameter variables.

The account must have:

```text
TENANT_SANDBOX_AND_PPC_APPLICATION_MGMT
```

The system super administrator can inspect the project but application
execution controls are disabled for that role. Use the project administrator
or data-consumer tenant for application operations.

### 5.4 Save and analyze

Save/update:

```http
POST /api/app/update
```

Static security analysis:

```http
POST /api/project/application/staticAnalyze
```

Body shape:

```json
{
  "projectId": "<projectId>",
  "envId": "<experimentEnvId>",
  "appId": "<appId>",
  "analyzeParam": {
    "appSandboxStaticParam": {
      "codeDetail": "<SQL or Python code>",
      "customParams": {}
    }
  }
}
```

### 5.5 Pre-execute

Endpoint:

```http
POST /api/app/instance/create
```

Body shape:

```json
{
  "projectId": "<projectId>",
  "envId": "<envId>",
  "appId": "<appId>",
  "dynamicParam": "{\"codeDetail\":\"<code>\",\"customParams\":{}}"
}
```

`SELECT 1 AS value` was intentionally tested. Application creation succeeded,
but static analysis and pre-execution both rejected it:

```text
Unsupported SQL operation:
org.apache.spark.sql.catalyst.plans.logical.OneRowRelation
```

The sandbox is not a general-purpose Spark console. SQL must read authorized
project data. Arbitrary constant-only SQL, DDL, system commands, and writes to
unapproved targets are outside the permitted data sandbox model.

No successful SQL result can be produced until data is authorized to this
project.

### 5.6 Publish and results

Relevant endpoints:

```text
POST /api/app/confirm
POST /api/app/publish
GET  /api/app/instance/query
GET  /api/app/instance/pageQuery
GET  /api/app/instance/result/pageQuery
GET  /api/app/instance/queryInstanceExecStatus
POST /api/app/instance/stop
```

Result export is approval-controlled. Relevant APIs include:

```text
/api/app/instance/result/export/task/pageQuery
/api/app/instance/result/export/task/query
/api/app/instance/result/export/subtask/pageQuery
```

## 6. Privacy Computing End-to-End Result

The working dataset replaced the unavailable `test3` Supabase source.

Input dataset:

```text
name: EchoAPI-Test1-20260622
coDatasetId: CO_DATASET_20260622145946_cKn52BoJ
owner: test1
sample: value_0=1.1, value_1=2.2, value_2=3.3
```

Privacy project:

```text
projectId: PROJ_20250320113805_e9T7iO8S
envId: ENV_20250320113805_uoZI9ZdP
project name: 720test
```

Successful redeployed application:

```text
name: echo-api-test1-2g-20260724-redeploy
appId: APP_20260724130311_0lF8PIlO
publisher: pds1Admin
participants: pds1Admin, test1
```

Resource approval:

```text
pds1Admin: 1 CPU, 2 GB memory, 2 GB storage
test1: 1 CPU, 2 GB memory, 2 GB storage
```

The application reached `Deployed` about 17 seconds after the `test1`
approval.

Successful real instance:

```text
instanceId: INSTANCE_20260724130806_NEe3Mpym
instance status: SUCCESS
execution status: INSTANCE_COMPLETED
error: none
```

Verified component sequence:

1. `test1` API dataset reader: `COMPONENT_COMPLETED/SUCCESS`.
2. Encrypted safe transfer from `test1` to `pds1Admin`:
   `COMPONENT_COMPLETED/SUCCESS`.
3. `pds1Admin` result writer: `COMPONENT_COMPLETED/SUCCESS`.

Successful result:

```text
coDatasetId: CO_DATASET_20260724130808_RBMGon94
label: data
type: STRUCTURED_DATA
status: SUCCESS
storage size: 882 bytes
rows: 1
columns: 3
value_0: 1.1
value_1: 2.2
value_2: 3.3
```

Core privacy APIs:

```text
POST /api/app/instance/create
GET  /api/app/instance/query
GET  /api/app/instance/queryInstanceExecStatus
GET  /api/app/instance/result/pageQuery
POST /api/dataset/io/sampleDataByCoDatasetId
```

The privacy workflow uses TCS APIs. The blockchain
`http://123.57.145.236:8088/privacy/task` path is legacy and must not be used
for this workflow.

## 7. Known Failures and Diagnosis

### 7.1 Unavailable `test3` API source

The former Supabase endpoints returned HTTP 404:

```text
/embed
/functions/v1/request_process_data
```

Historical runs using that source failed during data stream release. Do not use
`test3` as the health-check source.

### 7.2 Stale deployments

Historical applications remained in `Deploying` or used an old static dataset
definition at runtime. Deleting the stale deployment and publishing a new
application after the platform fix resolved the issue.

### 7.3 Non-sandbox participants

Creating a sandbox project with `pds1Admin/test1` failed after successful API
authentication because both are `TTN02` collaboration-node tenants, not
`TTN01` sandbox-node tenants.

### 7.4 Account AccessKey used as ISV key

Using a `PDS...` account AccessKey in the ISV HMAC headers fails before business
logic. Use `ISV_APIAUTH_AK/SK` from `.env` for the APIs documented here.

### 7.5 Constant-only SQL

`SELECT 1` is rejected by the sandbox security analyzer. Authorize a real
dataset and query its registered table/view instead.

## 8. Recommended Next Verification

To complete a successful sandbox execution:

1. Register or select a working dataset owned by `test`.
2. Authorize it to `PROJ_20260724141253_JjsSETbu`.
3. Query the authorized dataset metadata/table name.
4. Update `APP_20260724141525_I58U6E6W` with a read-only Spark SQL query.
5. Run static security analysis.
6. Pre-execute in `ENV_20260724141253_9ZbBjBre`.
7. Inspect the instance and result APIs.
8. Publish to `ENV_20260724141253_03rwxwi4` only after the experiment result is
   correct.

## 9. Local Commands

Unit tests:

```bash
deno task test
```

Real TCS privacy integration test:

```bash
RUN_TCS_INTEGRATION=true deno test --allow-read --allow-net --allow-env \
  src/core/tcs/client_test.ts --filter "TCS integration"
```

Never commit `.env`, downloaded AccessKey CSV files, or `.codex-local/*.key`.
