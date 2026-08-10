(function (root) {
  "use strict";

  const fields = Object.freeze({
    D: Object.freeze({ label: "기기 부족", help: "높을수록 학습 기기가 부족합니다." }),
    S: Object.freeze({ label: "학습공간 부족", help: "높을수록 안정적인 학습공간이 부족합니다." }),
    N: Object.freeze({ label: "인터넷 불안정", help: "높을수록 인터넷 사용이 어렵습니다." }),
    T: Object.freeze({ label: "이동 부담", help: "높을수록 학습 장소까지 이동 부담이 큽니다." }),
    C: Object.freeze({ label: "과거 완료율", help: "높을수록 과거 활동을 자주 완료했습니다." })
  });

  const presets = Object.freeze({
    v0: Object.freeze({
      id: "v0", name: "v0 과거 기록 중심", description: "과거 완료율을 40% 반영합니다.",
      weights: Object.freeze({ D: 20, S: 15, N: 15, T: 10, C: 40 }),
      threshold: 55, reviewBand: 0, reviewMissing: false
    }),
    v1: Object.freeze({
      id: "v1", name: "v1 현재 필요 중심", description: "현재의 기기·공간·인터넷·이동 부담만 반영합니다.",
      weights: Object.freeze({ D: 30, S: 25, N: 25, T: 20, C: 0 }),
      threshold: 65, reviewBand: 3, reviewMissing: false
    }),
    v2: Object.freeze({
      id: "v2", name: "v2 사람 확인 포함", description: "경계 점수와 빈칸을 사람이 다시 확인합니다.",
      weights: Object.freeze({ D: 30, S: 25, N: 25, T: 20, C: 0 }),
      threshold: 65, reviewBand: 5, reviewMissing: true
    })
  });

  // 실제 사람에게서 만들지 않은 새 합성 사례입니다.
  const syntheticCases = Object.freeze([
    { id: "S01", D: 4, S: 4, N: 3, T: 2, C: 0 },
    { id: "S02", D: 1, S: 1, N: 1, T: 1, C: 4 },
    { id: "S03", D: 3, S: 2, N: 4, T: 4, C: 0 },
    { id: "S04", D: 3, S: 3, N: 2, T: 2, C: 1 },
    { id: "S05", D: 2, S: 2, N: 2, T: 2, C: 4 },
    { id: "S06", D: 4, S: 1, N: 4, T: 2, C: 1 },
    { id: "S07", D: 2, S: 4, N: 3, T: 3, C: 0 },
    { id: "S08", D: 0, S: 0, N: 1, T: 1, C: 4 },
    { id: "S09", D: 3, S: 3, N: 3, T: 3, C: 2 },
    { id: "S10", D: 1, S: 4, N: 1, T: 4, C: 3 },
    { id: "S11", D: 4, S: 2, N: 2, T: 1, C: 0 },
    { id: "S12", D: 4, S: 4, N: 4, T: 4, C: 2 }
  ].map(Object.freeze));

  const clone = (value) => JSON.parse(JSON.stringify(value));
  root.NextbridgeFairnessData = Object.freeze({ fields, presets, syntheticCases, clone });
})(globalThis);
