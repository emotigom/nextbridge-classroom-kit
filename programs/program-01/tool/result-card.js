(function (root) {
  "use strict";

  const patterns = [
    ["이메일 주소로 보이는 값이 있습니다.", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
    ["전화번호로 보이는 값이 있습니다.", /(?:^|[^\d])(?:01[016789]|02|0[3-6][1-5]|070)[-\s.]?\d{3,4}[-\s.]?\d{4}(?:[^\d]|$)/],
    ["주민등록번호로 보이는 값이 있습니다.", /(?:^|[^\d])\d{6}[-\s]?[1-8]\d{6}(?:[^\d]|$)/],
    ["API 키로 보이는 값이 있습니다.", /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ["GitHub 토큰으로 보이는 값이 있습니다.", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/],
    ["인증 토큰으로 보이는 값이 있습니다.", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/]
  ];

  function assertText(value, label, min, max) {
    const text = typeof value === "string" ? value.trim() : "";
    if (text.length < min) throw new Error(`${label}을(를) 입력해 주세요.`);
    if (text.length > max) throw new Error(`${label}은(는) ${max}자 이하여야 합니다.`);
    return text;
  }

  function assertSafeText(values) {
    for (const value of values) {
      if (typeof value !== "string") continue;
      for (const [message, pattern] of patterns) if (pattern.test(value)) throw new Error(message);
    }
    return true;
  }

  function buildResultCard(input) {
    const teamCode = String(input?.teamCode || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,20}$/.test(teamCode)) {
      throw new Error("팀코드는 영문 대문자·숫자·하이픈으로 2~20자만 사용해 주세요.");
    }
    if (!/^\d+\.\d+\.\d+$/.test(String(input?.programVersion || ""))) {
      throw new Error("프로그램 버전 형식이 올바르지 않습니다.");
    }
    const summary = assertText(input?.summary, "핵심 결과", 1, 300);
    const nextStep = assertText(input?.nextStep, "다음 개선", 1, 300);
    if (!Array.isArray(input?.evidence) || input.evidence.length < 1 || input.evidence.length > 8) {
      throw new Error("검증 근거는 1~8개여야 합니다.");
    }
    const evidence = input.evidence.map((item) => ({
      label: assertText(item?.label, "검증 근거 이름", 1, 60),
      value: assertText(item?.value, "검증 근거 내용", 1, 500)
    }));
    if (input?.privacyChecked !== true) throw new Error("개인정보와 비밀정보가 없음을 확인해 주세요.");
    assertSafeText([summary, nextStep, ...evidence.flatMap((item) => [item.label, item.value])]);

    return {
      schemaVersion: "1.1",
      programId: "program-01",
      programVersion: input.programVersion,
      teamCode,
      completedAt: input.completedAt || new Date().toISOString(),
      summary,
      evidence,
      nextStep,
      aiDisclosure: {
        status: "not-applicable",
        note: "이 도구는 가중합 규칙 시뮬레이터이며 생성형 AI를 호출하지 않습니다."
      },
      privacyChecked: true
    };
  }

  root.NextbridgeFairnessResult = Object.freeze({ assertSafeText, buildResultCard });
})(globalThis);
