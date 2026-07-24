import { ViewerContext, ViewerResolver, ViewerRole } from "./types.ts";

const roles: ViewerRole[] = [
  "public",
  "partner",
  "enterprise",
  "evaluator",
  "regulator",
  "admin",
];

/**
 * Development-only adapter. Production code must provide a resolver backed by
 * gateway-verified JWT/mTLS/IAM claims; raw headers are not credentials.
 */
export class DevHeaderViewerResolver implements ViewerResolver {
  async resolve(request: Request): Promise<ViewerContext | null> {
    const candidate = request.headers.get("x-viewer-role");
    if (!candidate) return null;
    if (!roles.includes(candidate as ViewerRole)) {
      throw new Error("Invalid development x-viewer-role");
    }
    const authorizedEnterpriseIds = request.headers
      .get("x-authorized-enterprise-ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    return {
      role: candidate as ViewerRole,
      enterpriseId: request.headers.get("x-enterprise-id") || undefined,
      authorizedEnterpriseIds,
      principalId: "dev-header",
    };
  }
}

/**
 * Opt-in convenience for local manual testing. It is never enabled when ENV
 * is production, even if the opt-in variable was set accidentally.
 */
export function configuredDevelopmentViewerResolver():
  | ViewerResolver
  | undefined {
  if (Deno.env.get("ENV") === "production") return undefined;
  return Deno.env.get("ECO_ALLOW_DEV_HEADERS") === "true"
    ? new DevHeaderViewerResolver()
    : undefined;
}
