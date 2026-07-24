import { TcsPrivacy } from "../../core/tcs/index.ts";
import {
  SandboxExecution,
  SandboxExecutionRequest,
  SandboxPort,
} from "../ports.ts";

/**
 * Boundary for an approved TCS application. TCS datasets are pre-authorised;
 * this adapter intentionally never sends ProductData through a generic API.
 * A deployment must configure a TCS app that emits the documented result and
 * evidence schema, then provide a result mapper before it can be enabled.
 */
export class TcsSandboxAdapter implements SandboxPort {
  constructor(private readonly privacy = new TcsPrivacy()) {}

  async execute(_request: SandboxExecutionRequest): Promise<SandboxExecution> {
    const created = await this.privacy.createPrivacyInstance({});
    if (!created.success || !created.data) {
      throw new Error(
        created.message || "TCS sandbox instance could not be created",
      );
    }
    throw new Error(
      `TCS instance ${
        String(
          (created.data as { instanceId?: string }).instanceId || "created",
        )
      } created, but no approved result mapper is configured. No local result was substituted.`,
    );
  }
}
