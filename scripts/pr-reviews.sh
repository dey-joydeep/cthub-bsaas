#!/usr/bin/env bash
# WSL2/Ubuntu bash script.
# Prints PR review conversations (with resolved status) in your schema.
# Usage:
#   ./scripts/pr-reviews.sh --pr <PR_NUMBER> [--debug]
#   ./scripts/pr-reviews.sh --help

set -euo pipefail

usage() {
  cat <<'HELP'
Usage:
  ./scripts/pr-reviews.sh --pr <PR_NUMBER> [--debug]

Outputs JSON in the schema:
{
  "prNo": "xx",
  "reviews": [
    {
      "file": "xx/xx/xx",
      "reviewContent": [
        {
          "resolved": true|false|null,
          "codeBlockCommentOn": "L123  exact code line...\nL124  next line...",
          "comments": [
            {
              "commentator": "<name>",
              "date-time": "<yyyy/mm/dd hh24:mm:ss>",
              "comment": "..."
            }
          ]
        }
      ]
    }
  ]
}

Notes:
- Uses GraphQL review threads first (includes resolved).
- Falls back to REST review comments if threads are empty (resolved = null).

Requirements:
- gh (GitHub CLI)   — authenticated for this repo
- jq
HELP
}

PR_NUM=""
DEBUG=0

if [[ $# -eq 0 ]]; then usage; exit 1; fi
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr) PR_NUM="${2:-}"; shift 2;;
    --debug) DEBUG=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done
[[ -z "$PR_NUM" ]] && { usage; exit 1; }

command -v gh >/dev/null || { echo "Error: gh not found" >&2; exit 1; }
command -v jq >/dev/null || { echo "Error: jq not found" >&2; exit 1; }
gh auth status >/dev/null || { echo "Error: gh not authenticated" >&2; exit 1; }

# Repo context
read -r OWNER NAME < <(gh repo view --json owner,name -q '.owner.login + " " + .name')
[[ $DEBUG -eq 1 ]] && echo "[DBG] owner=$OWNER repo=$NAME pr=$PR_NUM" >&2

# jq helper functions (avoid read -d '')
JQ_FUNCS="$(cat <<'JQF'
def hdr(s): (s | capture("@@ -(?<a>\\d+)(?:,\\d+)? \\+(?<b>\\d+)(?:,\\d+)? @@"));
def code_with_lines($h; $start; $end):
  ( ($h // "") | split("\n")) as $lns
  | if ($lns|length)==0 or ($start==null) or ($end==null) then null
    else
      (hdr($lns[0]).b | tonumber) as $n0
      | (reduce ($lns[1:][]) as $l (
          {"n":$n0, "acc":[]};
          # deletions are from old file; do not advance new-file numbering
          if ($l|startswith("-")) then .
          else
            .acc = (if (.n >= $start and .n <= $end)
                      then .acc + [("L\(.n)  " + ($l | sub("^[ +]"; "")))]
                      else .acc
                    end)
            | .n += 1
          end
        ) | .acc | (if length>0 then join("\n") else null end)
      )
    end;
JQF
)"

# GraphQL query (review threads → has isResolved)
GQL="$(cat <<'EOF'
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first:100) {
        nodes {
          isResolved
          comments(first:100) {
            nodes {
              path
              diffHunk
              line
              startLine
              author { login }
              createdAt
              body
              url
            }
          }
        }
      }
    }
  }
}
EOF
)"

# 1) Try GraphQL (threads)
[[ $DEBUG -eq 1 ]] && echo "[DBG] fetching threads (GraphQL)..." >&2
GRAPHQL_JSON="$(gh api graphql -f owner="$OWNER" -f name="$NAME" -F number="$PR_NUM" -f query="$GQL" || true)"
THREAD_COUNT="$(printf '%s' "$GRAPHQL_JSON" | jq -r '.data.repository.pullRequest.reviewThreads.nodes | length? // 0')"
[[ $DEBUG -eq 1 ]] && echo "[DBG] thread_count=$THREAD_COUNT" >&2

if [[ "$THREAD_COUNT" -gt 0 ]]; then
  jq -n -r \
    --arg pr "$PR_NUM" \
    --argjson data "$GRAPHQL_JSON" \
    "$JQ_FUNCS
    ( \$data.data.repository.pullRequest.reviewThreads.nodes
    | map({
        resolved: .isResolved,
        comments: (.comments.nodes // [])
      })
    | map(select(.comments|length>0))
    | map(. + {
        path: (.comments[0].path // \"(no path)\"),
        _start: (.comments[0].startLine // .comments[0].line),
        _end:   (.comments[0].line // .comments[0].startLine),
        _hunk:  (.comments[0].diffHunk)
      })
    | group_by(.path)
    | map({
        file: .[0].path,
        reviewContent:
          ( map({
              resolved,
              codeBlockCommentOn:
                ( code_with_lines(._hunk; ._start; ._end)
                  // (._hunk // \"N/A\")
                | gsub(\"\r\"; \"\")
                ),
              comments:
                ( .comments
                | map({
                    commentator: (.author.login),
                    \"date-time\": (.createdAt | sub(\"T\";\" \") | sub(\"Z$\";\"\") | gsub(\"-\"; \"/\")),
                    comment: (.body | gsub(\"\r\"; \"\"))
                  })
                )
            }))
      })
    ) as \$byFile
    | { prNo: \$pr, reviews: \$byFile }"
  exit 0
fi

# 2) Fallback: REST review comments (no resolved info)
[[ $DEBUG -eq 1 ]] && echo "[DBG] falling back to REST /pulls/:num/comments ..." >&2
REST_JSON="$(gh api "repos/${OWNER}/${NAME}/pulls/${PR_NUM}/comments" || true)"
COMMENT_COUNT="$(printf '%s' "$REST_JSON" | jq -r 'length? // 0')"
[[ $DEBUG -eq 1 ]] && echo "[DBG] rest_comment_count=$COMMENT_COUNT" >&2

if [[ "$COMMENT_COUNT" -eq 0 ]]; then
  printf '{"prNo":"%s","reviews":[]}\n' "$PR_NUM"
  exit 0
fi

jq -n -r \
  --arg pr "$PR_NUM" \
  --argjson data "$REST_JSON" \
  "$JQ_FUNCS
  ( \$data
  | map(. + {
      _start: (.start_line // .original_start_line // .line // .original_line),
      _end:   (.line // .original_line // .start_line // .original_start_line)
    })
  | sort_by(.path)
  | group_by(.path)
  | map({
      file: .[0].path,
      reviewContent:
        ( group_by([._start, ._end, .diff_hunk])
        | map({
            resolved: null,
            codeBlockCommentOn:
              ( code_with_lines(.[0].diff_hunk; .[0]._start; .[0]._end)
                // (.[0].diff_hunk // \"N/A\")
              | gsub(\"\r\"; \"\")
              ),
            comments:
              ( map({
                  commentator: .user.login,
                  \"date-time\": (.created_at | sub(\"T\";\" \") | sub(\"Z$\";\"\") | gsub(\"-\"; \"/\")),
                  comment: (.body | gsub(\"\r\"; \"\"))
                }))
          })
        )
    })
  ) as \$byFile
  | { prNo: \$pr, reviews: \$byFile }"
