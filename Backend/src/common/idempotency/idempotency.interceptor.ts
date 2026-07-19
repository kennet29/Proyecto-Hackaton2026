import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { createHash } from "crypto";
import { Request, Response } from "express";
import { Observable, shareReplay, tap } from "rxjs";

type AuthenticatedRequest = Request & {
  user?: {
    userId?: number;
  };
};

type CacheEntry = {
  bodyHash: string;
  expiresAt: number;
  response$: Observable<unknown>;
};

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;
const IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, CacheEntry>();

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const operationId = request.header("Idempotency-Key")?.trim();

    if (
      !operationId ||
      !IDEMPOTENT_METHODS.has(request.method.toUpperCase()) ||
      !request.user?.userId
    ) {
      return next.handle();
    }

    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(operationId)) {
      throw new ConflictException("Idempotency-Key tiene un formato invalido");
    }

    this.removeExpiredEntries();
    const cacheKey = [
      request.user.userId,
      request.method.toUpperCase(),
      request.originalUrl,
      operationId,
    ].join(":");
    const bodyHash = createHash("sha256")
      .update(JSON.stringify(request.body ?? null))
      .digest("hex");
    const cached = this.cache.get(cacheKey);

    if (cached) {
      if (cached.bodyHash !== bodyHash) {
        throw new ConflictException(
          "Idempotency-Key ya fue utilizada con otros datos",
        );
      }
      response.setHeader("Idempotency-Replayed", "true");
      return cached.response$;
    }

    response.setHeader("Idempotency-Key", operationId);
    const response$ = next.handle().pipe(
      tap({
        error: () => {
          this.cache.delete(cacheKey);
        },
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(cacheKey, {
      bodyHash,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      response$,
    });
    this.enforceCacheLimit();
    return response$;
  }

  private removeExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  private enforceCacheLimit(): void {
    while (this.cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (!oldestKey) {
        break;
      }
      this.cache.delete(oldestKey);
    }
  }
}
