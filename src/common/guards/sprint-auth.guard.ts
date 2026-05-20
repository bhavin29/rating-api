import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Request } from "express";

type RequestPart = Record<string, unknown>;

@Injectable()
export class SprintAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = this.getRequest(context);
    const cookieUserId = this.getCookieValue(request, "sprint_auth");
    const requestUserId = this.getRequestUserId(context, request);

    if (!cookieUserId || !requestUserId || cookieUserId !== requestUserId) {
      throw new NotFoundException("Not found");
    }

    return true;
  }

  private getRequest(context: ExecutionContext): Request {
    if (context.getType<string>() === "graphql") {
      return GqlExecutionContext.create(context).getContext<{ req: Request }>()
        .req;
    }

    return context.switchToHttp().getRequest<Request>();
  }

  private getRequestUserId(
    context: ExecutionContext,
    request: Request,
  ): string | null {
    if (context.getType<string>() === "graphql") {
      const args = GqlExecutionContext.create(context).getArgs();
      return this.getUserIdFromSource(args);
    }

    return (
      this.getUserIdFromSource(request.params) ??
      this.getUserIdFromSource(request.query) ??
      this.getUserIdFromSource(request.body)
    );
  }

  private getUserIdFromSource(source: unknown): string | null {
    if (!this.isRecord(source)) {
      return null;
    }

    return (
      this.getStringValue(source.userId) ??
      this.getStringValue(source.raterId) ??
      this.getUserIdFromSource(source.input)
    );
  }

  private getCookieValue(request: Request, name: string): string | null {
    const cookies = request.headers.cookie;
    if (!cookies) {
      return null;
    }

    for (const cookie of cookies.split(";")) {
      const [cookieName, ...valueParts] = cookie.trim().split("=");
      if (cookieName === name) {
        return this.decodeCookieValue(valueParts.join("="));
      }
    }

    return null;
  }

  private decodeCookieValue(value: string): string | null {
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  private getStringValue(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  private isRecord(value: unknown): value is RequestPart {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
