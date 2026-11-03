export const projectOwner = 'dey-joydeep';
export const projectNumber = 1;

export function projectItemListArgs(owner = projectOwner, number = projectNumber) {
  return [
    'project',
    'item-list',
    String(number),
    '--owner',
    owner,
    '--format',
    'json',
    '--limit',
    '1000',
    '--jq',
    '{totalCount,items:[.items[] | {id,content:{url:.content.url},status,priority,size,domain}]}',
  ];
}

export function trackingIssueNumbers(body) {
  return [
    ...new Set(
      [...(body ?? '').matchAll(/\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+#([1-9]\d*)\b/gi)].map((match) => Number(match[1])),
    ),
  ];
}

export function assessProjectTracking(body, items, repo) {
  const issueNumbers = trackingIssueNumbers(body);
  if (!issueNumbers.length) return ['PR body must close or resolve a tracking issue in this repository'];
  const errors = [];
  for (const number of issueNumbers) {
    const url = `https://github.com/${repo}/issues/${number}`;
    const item = items.find((entry) => entry.content?.url === url);
    if (!item) {
      errors.push(`Tracking issue #${number} is not on GitHub Project ${projectOwner}/${projectNumber}`);
    } else if (!item.status) {
      errors.push(`Tracking issue #${number} has no Project Status`);
    } else if (!['In review', 'Release ready'].includes(item.status)) {
      errors.push(`Tracking issue #${number} is ${item.status}; set Project Status to In review before merge readiness`);
    }
  }
  return errors;
}
