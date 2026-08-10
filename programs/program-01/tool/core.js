(function (root) {
  "use strict";
  const data = root.NextbridgeFairnessData;
  const engine = root.NextbridgeFairnessEngine;
  const result = root.NextbridgeFairnessResult;
  if (!data || !engine || !result) throw new Error("실습 도구 구성 파일을 모두 불러오지 못했습니다.");
  root.NextbridgeFairnessCore = Object.freeze({ ...data, ...engine, ...result });
})(globalThis);
