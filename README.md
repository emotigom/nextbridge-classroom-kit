# Nextbridge Classroom Kit

학교와 강사가 **로그인이나 외부 서비스 없이 수업을 시작하고**, 팀 결과를 안전한 형식으로 남길 수 있도록 만드는 Nextbridge의 공개 실행 키트입니다.

> **현재 버전: Foundation v0.5**  
> 세 교육사업의 실제 명칭을 등록했고, 첫 번째 사업에 로그인 없는 `AI 공정성 감사관` 실습 도구를 연결했습니다.  
> 전체 교안·PPTX의 공개 범위와 콘텐츠 라이선스는 별도로 검토 중이며, `gom-clean` 연동은 꺼져 있습니다.

## 누구를 위한 저장소인가요?

| 독자 | 이 저장소에서 확인할 수 있는 것 |
|---|---|
| 학교·기관 담당자 | 설치 요구사항, 네트워크 의존성, 개인정보 처리 범위 |
| 강사 | 3분 시작 절차, 정상 결과, 오류 복구 방법, 결과카드 사용법 |
| 개발·운영 담당자 | 프로그램 manifest, JSON Schema, 보안 경계와 자동 검사 |

## 1분 안에 실행하기

Node.js 20 이상이 필요합니다. 별도 패키지 설치는 없습니다.

```bash
npm run check
npm run dev
```

터미널에 표시되는 `http://127.0.0.1:8080/`을 브라우저에서 엽니다.

- `npm run check`: 구조·보안 검사 → 단위 테스트 → 실제 로컬 서버 smoke test
- `npm run dev`: 학교 PC에서도 확인할 수 있는 로컬 정적 서버 실행

첫 번째 실습 도구만 바로 확인할 때는 `programs/program-01/tool/index.html`을 더블클릭할 수도 있습니다. `tool/` 폴더의 HTML·CSS·JavaScript 파일은 모두 함께 있어야 합니다.

## 지금 할 수 있는 일

### 공통 실행 화면

1. 세 사업의 현재 공개 상태를 확인합니다.
2. 실명 대신 팀코드만 입력합니다.
3. 팀의 결과·검증 근거·다음 개선을 기록합니다.
4. 생성형 AI 사용 여부와 범위를 남깁니다.
5. 같은 브라우저에 저장하거나 JSON 파일로 내려받습니다.

### program-01 · AI 공정성 감사관

- 과거 기록을 크게 반영하는 `v0`과 현재 필요를 보는 `v1`을 비교합니다.
- 경계 점수와 빈칸을 사람 확인으로 보내는 `v2`를 시험합니다.
- 다섯 가중치, 기준 점수, 사람 확인 범위를 직접 바꿉니다.
- 정상·경계·빈칸 사례를 따로 검증합니다.
- 공통 결과카드 1.1과 전체 실험 기록을 JSON으로 내려받습니다.

이 실습은 **실제 AI 모델이 아닙니다**. 다섯 입력을 가중합하는 수업용 규칙 시뮬레이터이며, `S01~S12`는 실제 사람에게서 만들지 않은 새 합성 사례입니다. 외부 API를 호출하지 않습니다.

입력 내용은 기본적으로 **현재 기기의 현재 브라우저에만 저장**됩니다. `gom-clean`이나 다른 서비스로 전송하지 않습니다.

## 등록된 세 교육사업

`program-01~03`은 바뀌지 않는 기술용 ID이고, 화면에는 실제 사업명을 표시합니다.

| ID | 사업명 | 현재 확인된 범위 | 공개 자료 상태 |
|---|---|---|---|
| `program-01` | 2026 찾아가는 AI교육 지원 프로그램 | 고등학교 1–3학년 · 4차시×50분 | `AI 공정성 감사관` starter·강사 기술안내 공개 |
| `program-02` | 2026 중등 학교급 전환기 찾아가는 AI·SW 프로그램 | 중학교 3학년·고등학교 3학년 | 차시·도구·산출물 미확정 |
| `program-03` | 2026 경기 성취도평가 표준화 평가도구 개발 합숙 워크숍 | 3일 합숙 워크숍 | 공개 실행 자료 범위 미확정 |

확인되지 않은 팀 인원, 기기 구성, 세부 차시는 임의로 채우지 않습니다. 자세한 기준은 [프로그램 공개 상태](docs/program-status.md)에서 확인합니다.

## 공개되어 있는 것과 아직 없는 것

### 사용할 수 있음

- 세 사업 catalog와 manifest
- program-01 로그인 없는 실습 도구와 새 합성데이터
- program-01 강사 실행·정상 결과·복구 안내
- 네트워크 없는 공통 결과카드
- 브라우저 저장·불러오기·삭제
- JSON 내려받기
- 개인정보·비밀정보 기본 패턴 검사
- 로컬 서버와 GitHub Actions 자동 검증

### 아직 공개하지 않음

- 전체 4차시 교안 원문과 PPTX
- 내부에서 준비 중인 기존 HTML·문서·CSV 사본
- 실제 학교·학생·강사 데이터
- 실제 참여코드와 수업 세션
- `gom-clean` integration API
- Supabase, R2, KV, Durable Objects의 운영 설정과 비밀키

이번에 공개한 `AI 공정성 감사관` starter는 새로 작성한 실행 코드와 새 합성 사례입니다. 기존 내부 교안·도구를 그대로 공개한 것이 아닙니다.

## 공통 결과카드 1.1

세 사업에서 공통으로 남기는 최소 정보입니다.

- 프로그램 ID와 버전
- 팀코드
- 완료 시각
- 핵심 결과
- 검증 근거
- 다음 개선
- 생성형 AI 사용 여부와 범위
- 개인정보 최종 확인

program-01 도구도 같은 규격의 결과카드를 직접 내려받습니다. 정확한 형식과 합성 예시는 [공통 결과카드 계약](docs/result-card-contract.md)에서 확인합니다.

## 저장소 구조

```text
.
├── demo/                                  # 공통 독립 실행 화면
├── programs/
│   ├── catalog.json                      # 세 사업 목록
│   ├── program-01/
│   │   ├── manifest.json
│   │   ├── instructor-guide.md           # 실습 도구 기술 운영 안내
│   │   └── tool/
│   │       ├── index.html                # 학생이 여는 화면
│   │       ├── data.js / engine.js       # 합성 사례와 가중합 계산
│   │       ├── result-card.js / core.js  # 결과카드 검사와 공개 API
│   │       ├── app-*.js                  # 화면·상태·내보내기
│   │       └── styles.css
│   ├── program-02/manifest.json
│   └── program-03/manifest.json
├── schemas/
│   ├── program-manifest.schema.json
│   └── result-card.schema.json
├── src/
│   ├── result-card.js                    # 공통 결과카드 런타임 검증
│   └── adapters/
│       ├── standalone.js                 # 브라우저 로컬 저장
│       └── gom-clean.stub.js             # 비활성 연동 경계
├── docs/
│   ├── program-status.md
│   ├── result-card-contract.md
│   ├── instructor-quick-start.md
│   ├── recovery-card.md
│   ├── architecture.md
│   ├── security-boundary.md
│   ├── gom-clean-integration-contract.md
│   └── roadmap.md
└── scripts/                              # 실행·구조·보안·smoke 검사
```

## 독립 실행과 `gom-clean`의 역할

### 공개 Classroom Kit

- 합성데이터와 공개 가능한 프로그램 정보
- 로그인 없는 수업 실행
- 팀코드 기반 결과카드
- 강사·학교 IT 안내
- 공개 가능한 연동 규격

### 비공개 `gom-clean`

- 교사 인증과 실제 수업 운영
- 학생 결과물 수합
- 세션·강의·학교 리포트
- 서버 키, 운영 설정, 감사 로그

공개 저장소는 비공개 저장소를 submodule·package·GitHub Actions checkout으로 읽지 않습니다. 향후 연결하더라도 검토된 HTTPS API만 사용하며, 서버는 공개 클라이언트를 신뢰하지 않고 모든 요청을 다시 검증해야 합니다.

## 프로그램을 추가하거나 수정할 때

1. 확인된 사실만 manifest에 넣습니다.
2. 일부 정보만 확인됐다면 `delivery.status`를 `partial`로 둡니다.
3. 승인 전 자료는 `resources.status`를 `pending-review` 또는 `not-started`로 둡니다.
4. 공개 자료는 안전한 `./` 상대경로로만 연결합니다.
5. 실제 사람이 아닌 합성데이터만 사용합니다.
6. 실제 AI가 아닌 기능을 AI라고 과장하지 않습니다.
7. 학생 화면에는 제작도구를 가능한 한 하나만 노출합니다.
8. 마지막에 `npm run check`를 통과시킵니다.

## 운영 문서

- [프로그램 공개 상태](docs/program-status.md)
- [program-01 강사 실행 안내](programs/program-01/instructor-guide.md)
- [강사용 3분 시작 안내](docs/instructor-quick-start.md)
- [오류 복구 카드](docs/recovery-card.md)
- [공통 결과카드 계약](docs/result-card-contract.md)
- [보안 경계](docs/security-boundary.md)
- [개발 로드맵](docs/roadmap.md)

## 라이선스

이 저장소의 소프트웨어 코드는 [MIT License](LICENSE)를 따르며 저작권자는 `Nextbridge`입니다.

교안 문구, 상표, 외부 이미지, 제안서에서 가져온 콘텐츠처럼 코드와 성격이 다른 자료는 MIT에 자동으로 포함되지 않습니다. 전체 교안·PPTX를 추가할 때는 공개 범위와 별도 라이선스를 먼저 확정합니다.
