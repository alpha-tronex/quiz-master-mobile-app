#!/usr/bin/env bash
# Testability audit — see the rn-testability rules (R1–R11, T1–T10).
# Run from the repo root:  npm run audit:testability   (or: bash scripts/testability-audit.sh [src])
#
# HARD checks fail the run (exit 1): the codebase is currently clean on these,
# so any hit is a new regression.
# ADVISORY checks only report: they still list known, pre-existing debt.
set -u
SRC=${1:-src}
hard_failures=0

section() { echo; echo "### $1"; }
report() {  # $1 = HARD|ADVISORY, stdin = findings
    local kind=$1 out
    out=$(sed 's/^/- /')
    if [ -z "$out" ]; then
        echo "none"
    else
        echo "$out"
        [ "$kind" = HARD ] && hard_failures=$((hard_failures + 1))
    fi
}

echo "## Testability audit ($SRC)"

section "[HARD] R1: fetch() outside shared/api/httpClient"
report HARD < <(
grep -rnE '(^|[^.[:alnum:]_])fetch\(' "$SRC" --include='*.ts' --include='*.tsx' \
    | grep -v __tests__ | grep -v 'shared/api/httpClient'
)

section "[HARD] R2: screens/components importing an api module directly"
report HARD < <(
grep -rnE "from '.*/api/[a-zA-Z]+\.api'" "$SRC" --include='*.tsx' \
    | grep -E '/(screens|components)/' | grep -v __tests__
)

section "[HARD] T1: un-awaited async RNTL calls in tests"
report HARD < <(
grep -rnE '^[[:space:]]*(const .* = )?(render|renderHook)\(|^[[:space:]]*(unmount|rerender)\(|^[[:space:]]*user\.(press|type|clear)' \
    "$SRC" --include='*.test.ts' --include='*.test.tsx' | grep -v await
)

section "[HARD] T3: QueryClient in tests without retry: false"
report HARD < <(
grep -rn 'new QueryClient(' "$SRC" --include='*.test.ts' --include='*.test.tsx' \
    | grep -v 'retry: false'
)

section "[HARD] T6: snapshot tests"
report HARD < <(
grep -rln 'toMatchSnapshot\|toMatchInlineSnapshot' "$SRC"
)

section "[ADVISORY] R11: source files with no colocated test"
report ADVISORY < <(
find "$SRC" -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*__tests__*' ! -name '*.d.ts' ! -name 'index.ts' \
    ! -path '*/types/*' ! -path '*/theme/*' | sort | while read -r f; do
    grep -q '@testability-exempt' "$f" && continue
    d=$(dirname "$f"); b=$(basename "$f"); b=${b%.*}
    ls "$d/__tests__/$b.test."* >/dev/null 2>&1 || echo "$f"
done
)

section "[ADVISORY] R5: clock/randomness inside screens/components"
report ADVISORY < <(
grep -rnE 'Date\.now\(|new Date\(\)|Math\.random\(' "$SRC" --include='*.tsx' | grep -v __tests__
)

section "[ADVISORY] R4: screens over 300 lines (extract logic)"
report ADVISORY < <(
find "$SRC" -path '*/screens/*.tsx' ! -path '*__tests__*' -exec wc -l {} + \
    | grep -v ' total$' | awk '$1>300{print $2" ("$1" lines)"}'
)

echo
if [ "$hard_failures" -gt 0 ]; then
    echo "**Result: FAIL** — $hard_failures hard check(s) have findings."
    exit 1
fi
echo "**Result: PASS** — no hard-check findings (advisory items above are known debt)."
