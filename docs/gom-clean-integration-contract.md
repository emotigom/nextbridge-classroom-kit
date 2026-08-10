# gom-clean Integration Contract

> 상태: **설계 초안 — 구현되지 않음**

이 문서는 공개 Classroom Kit과 비공개 `gom-clean` 사이의 최소 연결 범위를 정합니다. 실제 경로와 인증 방식은 `gom-clean`에서 별도로 검토한 뒤 구현합니다.

## 연결 원칙

- 공개 키트는 `gom-clean` 저장소나 데이터베이스에 직접 접근하지 않습니다.
- 모든 연결은 HTTPS API를 사용합니다.
- 독립 실행은 연결 없이 완성되어야 합니다.
- 연결 실패 시 결과를 로컬 JSON으로 내보낼 수 있어야 합니다.
- 브라우저에 장기 자격증명을 저장하지 않습니다.
- 공개 클라이언트는 변조될 수 있으므로 서버가 모든 요청을 다시 검증합니다.

## 제안 엔드포인트

경로는 아직 예약되지 않았으며 구현 시 변경될 수 있습니다.

| 목적 | 제안 | 공개 응답의 최소 범위 |
|---|---|---|
| 참여코드 교환 | `POST /api/v1/integrations/classroom-kit/join` | 짧은 만료 토큰·프로그램 ID·만료시각 |
| 프로그램 확인 | `GET /api/v1/integrations/classroom-kit/programs/{id}` | 공개 manifest와 고정 버전 |
| 결과 제출 | `POST /api/v1/integrations/classroom-kit/results` | 접수 ID·접수시각 |
| 상태 확인 | `GET /api/v1/integrations/classroom-kit/results/{id}` | 접수·검토·동결 상태 |

이 표는 구현 승인이 아닙니다. 실제 API 설계 검토 전까지 공개 adapter는 `enabled: false`와 fail-closed 동작을 유지합니다.

## 참여 토큰 요구조건

- 한 프로그램과 한 수업 세션에만 유효
- 권장 만료시간 2시간 이하
- 결과 제출 외 관리자 권한 없음
- 실제 학생 ID를 claim에 포함하지 않음
- 재사용 제한 또는 제출 횟수 제한
- 서버에서 즉시 폐기 가능

## 결과카드

`schemas/result-card.schema.json` 규격을 사용합니다. 현재 공개 계약 버전은 `1.1`이며, 제출 시 프로그램 버전과 결과카드 스키마 버전을 함께 확인해야 합니다.

서버는 스키마 통과 여부와 별개로 금지정보, 길이, 빈도, 세션 상태를 다시 검사해야 합니다. 브라우저의 기본 개인정보 검사는 보안 판정으로 사용하지 않습니다. CORS 허용은 인증을 대신하지 않습니다.

## 오류 계약

클라이언트가 복구 방향을 정할 수 있도록 다음 범주의 안정적인 오류코드를 제공합니다.

- `JOIN_CODE_INVALID`
- `JOIN_CODE_EXPIRED`
- `PROGRAM_VERSION_MISMATCH`
- `RESULT_SCHEMA_INVALID`
- `RESULT_TOO_LARGE`
- `RATE_LIMITED`
- `SESSION_CLOSED`
- `SERVICE_UNAVAILABLE`

`SERVICE_UNAVAILABLE`일 때는 제출을 반복하지 않고 로컬 내보내기로 전환합니다.
