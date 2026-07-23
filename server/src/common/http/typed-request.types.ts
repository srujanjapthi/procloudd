import type { Request } from "express";

export type TypedRequest<
  T extends {
    params?: object;
    body?: object;
    query?: object;
  } = object,
> = Request<T["params"], unknown, T["body"], T["query"]>;
