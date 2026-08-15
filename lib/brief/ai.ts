/**
 * Future AI interpretation should receive structured brief JSON, not raw
 * production, quality, supply, or maintenance extracts. Keep attainment,
 * variance, thresholds, days of supply, schedule risk, status, priority,
 * and ownership in the operational engine.
 *
 * A later layer can summarize the shift, explain relationships between
 * issues, draft leadership briefs, or prepare meeting follow-up from this
 * shape.
 *
 * Operational data → deterministic exception engine → structured issues
 * → optional AI synthesis → management brief
 */
export type BriefInterpretationRequest = {
  scenarioId: string;
  briefDate: string;
  plantStatus: string;
  overallAttainmentPct: number;
  issueIds: string[];
  priorityIds: string[];
  categoryCounts: {
    production: number;
    quality: number;
    supply: number;
    maintenance: number;
    schedule: number;
  };
};

export type FutureBriefIngest = {
  format: "production_csv" | "downtime" | "quality" | "supply" | "maintenance" | "erp_mes";
  recordCount: number;
};
