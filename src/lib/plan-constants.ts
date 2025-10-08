const parsePlanLimit = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const getEnvValue = (serverKey: string, publicKey: string): string | undefined => {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env[serverKey] ?? process.env[publicKey];
};

export const FREE_PLAN_TEAM_LIMIT = parsePlanLimit(
  getEnvValue("FREE_PLAN_TEAM_LIMIT", "NEXT_PUBLIC_FREE_PLAN_TEAM_LIMIT"),
  1
);

export const FREE_PLAN_MEMBER_LIMIT = parsePlanLimit(
  getEnvValue("FREE_PLAN_MEMBER_LIMIT", "NEXT_PUBLIC_FREE_PLAN_MEMBER_LIMIT"),
  3
);
