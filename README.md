# Nextbridge Classroom Kit

**Nextbridge**의 여러 교육사업에서 함께 사용할 수 있는 공개형 수업 실행 키트입니다.

이 저장소의 목표는 강사와 학교가 복잡한 설치나 유료 계정 없이도 수업 자료를 확인하고, 합성데이터로 실습하고, 최소정보 결과카드를 남길 수 있게 하는 것입니다. 실제 학교·학생 데이터와 운영 비밀정보는 이 저장소에 두지 않습니다.

## 현재 상태

> **Foundation / v0.3**  
> 실제 세 사업의 이름과 교안은 아직 연결하지 않았습니다. `program-01`부터 `program-03`까지는 사업별 콘텐츠가 들어갈 안전한 자리입니다.

- 독립 실행을 기본값으로 사용합니다.
- `gom-clean` 연동은 명시적으로 비활성화되어 있습니다.
- 학생 식별은 실명 대신 팀코드만 사용합니다.
- 예시는 실제 사람에게서 만들지 않은 합성데이터만 사용합니다.
- 공통 결과카드는 결과·검증 근거·다음 개선·AI 사용 공개를 기록합니다.
- 학교급·수업시간·팀구성은 확정 전까지 `unconfirmed`로 두며 임의 값을 넣지 않습니다.
- 프로그램 정의와 결과카드는 공개 JSON 규격으로 검증합니다.
- 프로그램 발행 주체는 `Nextbridge`로 통일합니다.

## 저장소 구조

```text
.
├── demo/                         # 브라우저에서 확인하는 독립 실행 데모
├── programs/
│   ├── catalog.json             # 프로그램 목록의 단일 진입점
│   ├── program-01/manifest.json # 세 사업의 임시 자리
│   ├── program-02/manifest.json
│   └── program-03/manifest.json
├── schemas/
│   ├── program-manifest.schema.json
│   └── result-card.schema.json
├── src/
│   ├── result-card.js           # 결과카드 런타임 검증과 기본정보 검사
│   └── adapters/
│       ├── standalone.js        # 네트워크 없는 로컬 저장
│       └── gom-clean.stub.js     # 아직 연결되지 않은 안전한 경계
├── docs/
│   ├── result-card-contract.md
│   ├── instructor-quick-start.md
│   ├── recovery-card.md
│   ├── architecture.md
│   ├── security-boundary.md
│   ├── gom-clean-integration-contract.md
│   └── roadmap.md
├── config/brand.json             # Nextbridge 브랜드 단일 기준
└── scripts/                       # 실행 서버와 구조·보안·smoke 검사
```

## 빠르게 확인하기

별도 패키지 설치 없이 사용할 수 있습니다. Node.js 20 이상에서 다음 명령을 실행합니다.

```bash
npm run check
npm run dev
```

브라우저에서 `http://127.0.0.1:8080/`을 엽니다. `npm run check`는 구조·보안 검사, 단위 테스트, 로컬 서버 smoke test를 순서대로 실행합니다.

## 공통 결과카드 1.1

세 사업에서 공통으로 사용하는 필드는 다음과 같습니다.

- 프로그램 ID와 버전
- 팀코드
- 완료 시각
- 핵심 결과
- 검증 근거
- 다음 개선
- 생성형 AI 사용 여부와 범위
- 개인정보 최종 확인

정확한 형식과 합성 예시는 [공통 결과카드 계약](docs/result-card-contract.md)에서 확인합니다.

## 수업 운영 안내

- [강사용 3분 시작 안내](docs/instructor-quick-start.md)
- [오류 복구 카드](docs/recovery-card.md)

브라우저 저장본은 같은 기기·같은 브라우저에서만 불러올 수 있습니다. 수업 종료 전에 필요한 팀만 JSON을 내려받습니다.

## 두 가지 실행 모드

### 1. 독립 실행

학교망 또는 계정 환경과 관계없이 브라우저에서 실행합니다. 결과는 해당 기기의 브라우저에만 저장하며 JSON 파일로 내보낼 수 있습니다.

### 2. gom-clean 연결

향후 교사가 `gom-clean`에서 수업을 시작하면 짧은 참여코드를 제한된 수업권한으로 교환하고, 결과카드만 안전하게 수합하는 선택 기능입니다.

공개 저장소는 비공개 `gom-clean` 소스코드나 데이터베이스에 접근하지 않습니다. 연결은 배포된 HTTPS API만 사용하며, 서버는 공개 클라이언트를 신뢰하지 않고 모든 요청을 다시 검증해야 합니다.

## 프로그램 추가 원칙

1. `programs/<program-id>/manifest.json`을 만듭니다.
2. 학생이 직접 식별되는 정보는 넣지 않습니다.
3. 실제 사람이 아닌 합성데이터만 예시에 사용합니다.
4. 네트워크가 없어도 달성할 수 있는 핵심 활동을 둡니다.
5. 학생 화면에는 제작도구를 가능한 한 하나만 노출합니다.
6. `npm run check`가 통과해야 합니다.

## 라이선스

이 저장소의 소프트웨어는 [MIT License](LICENSE)를 따릅니다.

교안·상표·외부 이미지처럼 코드와 성격이 다른 콘텐츠를 추가할 때는 공개 범위와 권리관계를 별도로 검토합니다.
