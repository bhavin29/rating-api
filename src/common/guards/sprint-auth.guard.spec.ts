import { ExecutionContext, NotFoundException } from "@nestjs/common";
import { SprintAuthGuard } from "./sprint-auth.guard";

describe("SprintAuthGuard", () => {
  const guard = new SprintAuthGuard();

  it("allows requests when the sprint auth cookie matches the request userId", () => {
    const context = createHttpContext({
      headers: { cookie: "sprint_auth=user-1" },
      query: { userId: "user-1" },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows requests when the sprint auth cookie matches a nested raterId", () => {
    const context = createHttpContext({
      headers: { cookie: "sprint_auth=user-1" },
      body: { input: { raterId: "user-1" } },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws not found when the cookie is missing", () => {
    const context = createHttpContext({ query: { userId: "user-1" } });

    expect(() => guard.canActivate(context)).toThrow(NotFoundException);
  });

  it("throws not found when the cookie does not match the request userId", () => {
    const context = createHttpContext({
      headers: { cookie: "sprint_auth=user-2" },
      query: { userId: "user-1" },
    });

    expect(() => guard.canActivate(context)).toThrow(NotFoundException);
  });
});

function createHttpContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getType: () => "http",
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        params: {},
        query: {},
        body: {},
        ...request,
      }),
    }),
  } as ExecutionContext;
}
