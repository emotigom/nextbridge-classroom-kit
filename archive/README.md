# 보관된 선택 기능

현재 루트는 의도적으로 단순하게 유지합니다. 아래 기능은 필요 여부가 확정될 때까지 활성 경로에서 제거했지만, Git 이력에는 그대로 보관되어 있습니다.

## 보관 기준

```text
commit: 92b4603d7a904b8fec43bc330d9a704dbc6d40ef
message: docs: simplify public program labels
```

이 커밋에는 다음 기능이 모두 들어 있습니다.

| 기능 | 이전 경로 |
|---|---|
| 공통 독립 실행 화면과 결과카드 | `demo/` |
| 결과카드 저장·검증 코드 | `src/` |
| 프로그램·결과카드 JSON Schema | `schemas/` |
| 기준 비교 실습 | `programs/program-01/tool/` |
| 실습 강사 안내 | `programs/program-01/instructor-guide.md` |
| 상세 운영·복구·연동 문서 | `docs/` |
| 단위 테스트와 smoke test | `tests/`, `scripts/smoke.mjs` |
| 상세 검증 모듈 | `scripts/validation/` |

## 필요한 폴더 하나만 복원하기

저장소 루트에서 다음처럼 실행합니다.

```bash
git checkout 92b4603d7a904b8fec43bc330d9a704dbc6d40ef -- demo
```

다른 예시:

```bash
# 기준 비교 실습만 복원
git checkout 92b4603d7a904b8fec43bc330d9a704dbc6d40ef -- \
  programs/program-01/tool \
  programs/program-01/instructor-guide.md

# 결과카드와 Schema만 복원
git checkout 92b4603d7a904b8fec43bc330d9a704dbc6d40ef -- \
  src \
  schemas \
  docs/result-card-contract.md
```

복원한 파일은 바로 운영 기능으로 간주하지 않습니다. 현재 프로그램과 맞는지 확인한 뒤 필요한 부분만 다듬고 `npm run check`를 통과시켜야 합니다.

## 전체 상태를 별도로 열어보기

현재 `main`을 건드리지 않고 당시 상태를 확인하려면 다음처럼 임시 브랜치를 만들 수 있습니다.

```bash
git switch -c review/archived-classroom-workflow \
  92b4603d7a904b8fec43bc330d9a704dbc6d40ef
```

확인을 마친 뒤 원래 `main`으로 돌아옵니다.

```bash
git switch main
```

## 다시 활성화하기 전 확인

- 지금 수업에서 실제로 필요한 기능인지
- 학생 화면에 도구가 너무 많이 노출되지 않는지
- 실제 데이터나 내부 사업정보가 들어 있지 않은지
- 외부 서비스 장애 없이 핵심 활동이 가능한지
- `gom-clean` 연동이 계속 비활성인지
- 현재 교안 문구와 기능이 서로 맞는지

과거 기능을 한꺼번에 복원하기보다, 필요한 폴더만 선택해서 가져오는 방식을 권장합니다.
