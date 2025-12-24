/**
 * Minimal single-span diff helper for the Memory Injection win cinematic.
 * We want to highlight exactly one changed region (prefix + changed + suffix).
 *
 * Contract:
 *   singleSpanDiff(before, after) =>
 *     { ok:true, prefix, beforeMid, afterMid, suffix }
 *     OR { ok:false, prefix, beforeMid, afterMid, suffix } (best-effort)
 */

function safeStr(v) {
  return String(v ?? '');
}

export function singleSpanDiff(before, after) {
  const a = safeStr(before);
  const b = safeStr(after);

  if (a === b) {
    return { ok: true, prefix: a, beforeMid: '', afterMid: '', suffix: '' };
  }

  const minLen = Math.min(a.length, b.length);

  // Longest common prefix
  let p = 0;
  while (p < minLen && a.charCodeAt(p) === b.charCodeAt(p)) p++;

  // Longest common suffix (bounded so it doesn't overlap prefix)
  let sa = a.length - 1;
  let sb = b.length - 1;
  while (sa >= p && sb >= p && a.charCodeAt(sa) === b.charCodeAt(sb)) {
    sa--;
    sb--;
  }

  const prefix = a.slice(0, p);
  const beforeMid = a.slice(p, sa + 1);
  const afterMid = b.slice(p, sb + 1);
  const suffix = a.slice(sa + 1);

  // We call it ok if each string can be reconstructed from (prefix/mid/suffix).
  const ok = (prefix + beforeMid + suffix) === a && (prefix + afterMid + suffix) === b;
  return { ok, prefix, beforeMid, afterMid, suffix };
}


