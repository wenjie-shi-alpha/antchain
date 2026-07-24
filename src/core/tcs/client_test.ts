import { assert, assertEquals } from "@std/assert";
import {
  buildDynamicParamFromStaticParam,
  connectParamMap,
  TcsClient,
} from "./client.ts";
import { TcsPrivacy } from "./privacy.ts";

Deno.test("connectParamMap sorts keys before signing", () => {
  assertEquals(connectParamMap({ b: "2", a: "1" }), "a=1&b=2");
});

Deno.test("TcsClient signs requests with ISV HMAC content order", async () => {
  const client = new TcsClient({
    restUrl: "http://tcs.test",
    isvAk: "ak",
    isvSk: "secret",
    tenantId: "tenant",
    authenticationType: "isv",
    authenticationVersion: "1.0",
    signatureMethod: "SHA256_HMAC",
    defaultProjectId: "p",
    defaultEnvId: "e",
    defaultAppId: "a",
    pollIntervalMs: 1,
    pollTimeoutMs: 1,
  });

  const body = JSON.stringify({ projectId: "p", envId: "e", appId: "a" });
  const headers = await client.buildSignedHeaders(
    new URL("http://tcs.test/api/app/instance/create"),
    body,
    "tenant",
  );

  assertEquals(
    headers["x-signature"],
    "NuJe+JAlroY4gUARtM1K9a3RLAZ8caaoGNHxXISTYDA=",
  );
});

Deno.test("buildDynamicParamFromStaticParam matches workbench create payload", () => {
  const dynamicParam = buildDynamicParamFromStaticParam({
    operatorList: [
      {
        code: "dataset_reader",
        id: "reader-1",
        meta: null,
        staticParameter: '{"co_dataset_id":"co1","fields":["a"]}',
      },
      {
        code: "data_writer",
        id: "writer-1",
        meta: '{"x":1}',
        staticParameter: { name: "data" },
      },
    ],
  });

  assertEquals(dynamicParam, {
    dynamicParameter: "",
    operatorList: [
      {
        code: "dataset_reader",
        id: "reader-1",
        meta: "{}",
        dynamicParameter: '{"co_dataset_id":"co1","fields":["a"]}',
      },
      {
        code: "data_writer",
        id: "writer-1",
        meta: '{"x":1}',
        dynamicParameter: '{"name":"data"}',
      },
    ],
  });
});

Deno.test({
  name: "TCS integration creates a new privacy instance and reads sample data",
  ignore: Deno.env.get("RUN_TCS_INTEGRATION") !== "true",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const privacy = new TcsPrivacy();
    const result = await privacy.runPrivacyInstanceToResult();

    assert(result.success, JSON.stringify(result, null, 2));
    assertEquals(result.data?.instance.status, "SUCCESS");
    assertEquals(result.data?.result.status, "SUCCESS");
    assert(result.data?.result.coDatasetId);
    assert(result.data?.sampleData);
  },
});
