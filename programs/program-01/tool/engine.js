(function (root) {
  "use strict";

  const data = root.NextbridgeFairnessData;
  if (!data) throw new Error("data.js를 먼저 불러와 주세요.");
  const keys = Object.keys(data.fields);

  function normalizeConfig(config) {
    const fallback = data.presets.v0;
    const weights = {};
    for (const key of keys) {
      const value = Number(config?.weights?.[key]);
      weights[key] = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback.weights[key];
    }
    const threshold = Number(config?.threshold);
    const reviewBand = Number(config?.reviewBand);
    return {
      weights,
      threshold: Number.isFinite(threshold) ? Math.max(0, Math.min(100, threshold)) : fallback.threshold,
      reviewBand: Number.isFinite(reviewBand) ? Math.max(0, Math.min(20, reviewBand)) : fallback.reviewBand,
      reviewMissing: Boolean(config?.reviewMissing)
    };
  }

  function scoreCase(record, rawConfig) {
    const config = normalizeConfig(rawConfig);
    let score = 0;
    let missing = false;
    for (const key of keys) {
      let value = record[key];
      if (value === "" || value === null || value === undefined) {
        missing = true;
        value = 0;
      }
      const number = Number(value);
      const bounded = Number.isFinite(number) ? Math.max(0, Math.min(4, number)) : 0;
      score += (bounded / 4) * config.weights[key];
    }
    const decision = score >= config.threshold ? "priority" : "general";
    const nearBoundary = config.reviewBand > 0 && Math.abs(score - config.threshold) <= config.reviewBand;
    return {
      ...data.clone(record),
      score: Math.round(score * 100) / 100,
      missing,
      decision,
      handling: nearBoundary || (config.reviewMissing && missing) ? "review" : decision
    };
  }

  const calculate = (records, config) => records.map((record) => scoreCase(record, config));

  function compare(referenceResults, currentResults) {
    const reference = new Map(referenceResults.map((result) => [result.id, result]));
    return currentResults.filter((result) => {
      const before = reference.get(result.id);
      return before && (before.decision !== result.decision || before.handling !== result.handling);
    }).map((result) => result.id);
  }

  function quickTests(config) {
    const byId = new Map(data.syntheticCases.map((record) => [record.id, record]));
    const missingRecord = data.clone(byId.get("S07"));
    missingRecord.N = null;
    return {
      normal: scoreCase(data.clone(byId.get("S09")), config),
      boundary: scoreCase(data.clone(byId.get("S04")), config),
      missing: scoreCase(missingRecord, config)
    };
  }

  root.NextbridgeFairnessEngine = Object.freeze({ normalizeConfig, scoreCase, calculate, compare, quickTests });
})(globalThis);
