interface SubGroup<Base extends string, Routes extends RouteGroup> {
  readonly base: Base;
  readonly routes: Routes;
}

type RouteValue = string | SubGroup<string, RouteGroup>;
type RouteGroup = Record<string, RouteValue>;

type ResolveRoutes<Prefix extends string, Routes extends RouteGroup> = {
  readonly [K in keyof Routes]: Routes[K] extends string
    ? `${Prefix}${Routes[K]}`
    : Routes[K] extends SubGroup<infer Base, infer Nested>
      ? ResolveRoutes<`${Prefix}${Base}`, Nested>
      : never;
};

export function subgroup<
  const Base extends string,
  const Routes extends RouteGroup,
>(base: Base, routes: Routes): SubGroup<Base, Routes> {
  return { base, routes };
}

function resolveRoutes<
  const Prefix extends string,
  const Routes extends RouteGroup,
>(prefix: Prefix, routes: Routes): ResolveRoutes<Prefix, Routes> {
  return Object.fromEntries(
    Object.entries(routes).map(([key, value]) =>
      typeof value === "string"
        ? [key, `${prefix}${value}`]
        : [key, resolveRoutes(`${prefix}${value.base}`, value.routes)]
    )
  ) as ResolveRoutes<Prefix, Routes>;
}

export function createRouter<const Prefix extends string>(prefix: Prefix) {
  return {
    route<const Path extends string>(path: Path) {
      return `${prefix}${path}`;
    },

    group<const Base extends string, const Routes extends RouteGroup>(
      base: Base,
      routes: Routes
    ) {
      return resolveRoutes(`${prefix}${base}` as `${Prefix}${Base}`, routes);
    },
  };
}
