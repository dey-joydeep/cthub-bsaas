param(
  [Parameter(Mandatory=$false)][int]$pr,
  [switch]$debug,
  [switch]$help
)

function Show-Help {
@'
Usage:
  .\scripts\pr-reviews.ps1 --pr <PR_NUMBER> [--debug]

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
Requirements: gh, jq (available in PATH)
'@
}

if ($help -or -not $PSBoundParameters.ContainsKey('pr')) { Show-Help; exit 1 }

# Dependencies
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Error "gh not found"; exit 1 }
if (-not (Get-Command jq -ErrorAction SilentlyContinue)) { Write-Error "jq not found"; exit 1 }
try { gh auth status | Out-Null } catch { Write-Error "gh not authenticated"; exit 1 }

# Repo context
$repoJson = gh repo view --json owner,name | ConvertFrom-Json
$owner = $repoJson.owner.login
$name  = $repoJson.name
if ($debug) { Write-Host "[DBG] owner=$owner repo=$name pr=$pr" -ForegroundColor Cyan }

# jq helper functions
$jqFuncs = @'
def hdr(s): (s | capture("@@ -(?<a>\\d+)(?:,\\d+)? \\+(?<b>\\d+)(?:,\\d+)? @@"));
def code_with_lines($h; $start; $end):
  ( ($h // "") | split("\n")) as $lns
  | if ($lns|length)==0 or ($start==null) or ($end==null) then null
    else
      (hdr($lns[0]).b | tonumber) as $n0
      | (reduce ($lns[1:][]) as $l (
          {"n":$n0, "acc":[]};
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
'@

# GraphQL query (review threads → has isResolved)
$gql = @'
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
'@

# Fetch GraphQL threads
if ($debug) { Write-Host "[DBG] fetching threads (GraphQL)..." -ForegroundColor Cyan }
$graphQLJson = gh api graphql -f owner="$owner" -f name="$name" -F number="$pr" -f query="$gql"
$threadCount = & jq -n --argjson data "$graphQLJson" '$data.data.repository.pullRequest.reviewThreads.nodes | length? // 0'
if ($debug) { Write-Host "[DBG] thread_count=$threadCount" -ForegroundColor Cyan }

# Prepare temp jq files (quoting-safe)
$jqTempDir = Join-Path $env:TEMP "pr-reviews"
New-Item -ItemType Directory -Force -Path $jqTempDir | Out-Null
$jqGraphQLFile = Join-Path $jqTempDir "graphql.jq"
$jqRestFile    = Join-Path $jqTempDir "rest.jq"

$jqGraphQLCore = @'
( $data.data.repository.pullRequest.reviewThreads.nodes
| map({
    resolved: .isResolved,
    comments: (.comments.nodes // [])
  })
| map(select(.comments|length>0))
| map(. + {
    path: (.comments[0].path // "(no path)"),
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
              // (._hunk // "N/A")
            | gsub("\r"; "")
            ),
          comments:
            ( .comments
            | map({
                commentator: (.author.login),
                "date-time": (.createdAt | sub("T";" ") | sub("Z$";"") | gsub("-"; "/")),
                comment: (.body | gsub("\r"; ""))
              })
            )
        }))
  })
) as $byFile
| { prNo: $pr, reviews: $byFile }
'@

$jqRestCore = @'
( $data
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
              // (.[0].diff_hunk // "N/A")
            | gsub("\r"; "")
            ),
          comments:
            ( map({
                commentator: .user.login,
                "date-time": (.created_at | sub("T";" ") | sub("Z$";"") | gsub("-"; "/")),
                comment: (.body | gsub("\r"; ""))
              }))
        })
      )
  })
) as $byFile
| { prNo: $pr, reviews: $byFile }
'@

Set-Content -Path $jqGraphQLFile -Value ($jqFuncs + "`n" + $jqGraphQLCore) -Encoding UTF8
Set-Content -Path $jqRestFile    -Value ($jqFuncs + "`n" + $jqRestCore)    -Encoding UTF8

if ([int]$threadCount -gt 0) {
  # GraphQL path (includes resolved)
  & jq -n -r --arg pr "$pr" --argjson data "$graphQLJson" -f $jqGraphQLFile
  exit $LASTEXITCODE
}

# Fallback: REST review comments
if ($debug) { Write-Host "[DBG] falling back to REST /pulls/:num/comments ..." -ForegroundColor Cyan }
$restJson = gh api "repos/$owner/$name/pulls/$pr/comments"
$commentCount = & jq -n --argjson data "$restJson" '($data | length? // 0)'
if ($debug) { Write-Host "[DBG] rest_comment_count=$commentCount" -ForegroundColor Cyan }

if ([int]$commentCount -eq 0) {
  # Emit empty valid JSON
  @{ prNo = "$pr"; reviews = @() } | ConvertTo-Json -Depth 10
  exit 0
}

& jq -n -r --arg pr "$pr" --argjson data "$restJson" -f $jqRestFile
exit $LASTEXITCODE
