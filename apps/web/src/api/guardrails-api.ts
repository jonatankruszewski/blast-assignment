import type {
  ActivityPoint,
  ActivityRange,
  CloudUnit,
  DefenseFilters,
  DeployResult,
  Guardrail,
  GuardrailDefense,
  TabRowMap,
} from "../domain/guardrail.types.js";
import {
  activitiesFixture,
  cloudUnitsFixture,
  defenseFixture,
  guardrailsFixture,
  scaleDefenseForCloudUnit,
  tabRowsFixture,
} from "../mocks/guardrails.fixtures.js";

/** Fake network settings. Tests set latency to 0 and control `random`. */
export const apiConfig = {
  latencyMs: 300,
  deployFailureRate: 0.1,
  random: Math.random,
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function respond<T>(produce: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, apiConfig.latencyMs);
  });
}

function findGuardrail(id: string): Guardrail {
  const guardrail = guardrailsFixture.find((g) => g.id === id);
  if (!guardrail) throw new ApiError(`Guardrail ${id} not found`, 404);
  return guardrail;
}

const RANGE_DAYS: Record<ActivityRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const guardrailsApi = {
  listGuardrails: (): Promise<Guardrail[]> => respond(() => guardrailsFixture),

  getGuardrail: (id: string): Promise<Guardrail> => respond(() => findGuardrail(id)),

  listCloudUnits: (): Promise<CloudUnit[]> => respond(() => cloudUnitsFixture),

  getDefense: (id: string, filters: DefenseFilters): Promise<GuardrailDefense> =>
    respond(() => scaleDefenseForCloudUnit(defenseFixture(findGuardrail(id)), filters.cloudUnit)),

  getActivities: (id: string, range: ActivityRange): Promise<ActivityPoint[]> =>
    respond(() => activitiesFixture(findGuardrail(id)).slice(-RANGE_DAYS[range])),

  getTabRows: <K extends keyof TabRowMap>(id: string, tab: K): Promise<TabRowMap[K][]> =>
    respond(() => tabRowsFixture(findGuardrail(id), tab)),

  deployGuardrail: (id: string): Promise<DeployResult> =>
    respond(() => {
      const guardrail = findGuardrail(id);
      if (apiConfig.random() < apiConfig.deployFailureRate) {
        throw new ApiError("Deployment failed: the policy service is unavailable. Try again.", 503);
      }
      guardrail.status = "deployed";
      return { guardrailId: id, deployedAt: new Date().toISOString() };
    }),
};
