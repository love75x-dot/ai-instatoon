// 글 등록 전 품질·중복 검사. 하나라도 걸리면 빌드가 실패한다(대량 생성/중복 글이 섞이지 않게 하는 안전장치).
import { CATS } from './lib.mjs';

const bigrams = (s) => {
  const t = String(s).replace(/[\s\p{P}]/gu, '');
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
};
const sim = (a, b) => {
  const A = bigrams(a), B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const x of A) if (B.has(x)) n++;
  return n / (A.size + B.size - n);
};
const textOf = (a) => [a.lead, ...a.sections.flatMap((s) => [s.h, ...s.blocks.flatMap((b) => [b.v, b.title, ...(b.head || []), ...(b.rows || [])].flat(2))])]
  .filter((x) => typeof x === 'string').join(' ');

// 근거 없는 성과 보장/통계성 표현, 미완성 흔적
const BANNED = [
  [/(매출|방문|팔로워|조회|예약|구매)[^.\n]{0,12}\d+\s*(%|퍼센트|배)\s*(이상\s*)?(증가|상승|늘|성장)/, '성과 수치 보장/통계성 표현'],
  [/(승인|노출|상위)\s*(을\s*)?(보장|확정)/, '승인/노출 보장 표현'],
  [/애드센스/, '애드센스 언급'],
  [/\bTODO\b|lorem ipsum|여기에 작성/i, '미완성 흔적'],
];

export function validate(all) {
  const errs = [], warns = [];
  const seen = { slug: new Map(), title: new Map(), metaTitle: new Map(), desc: new Map() };
  const slugs = new Set(all.map((a) => a.slug));
  for (const a of all) {
    const w = (m) => errs.push(`[${a.slug}] ${m}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug || '')) w('slug는 소문자·숫자·하이픈만 (예: my-new-post)');
    if (!CATS[a.cat]) w(`cat은 ${Object.keys(CATS).join('/')} 중 하나`);
    for (const k of ['title', 'metaTitle', 'desc', 'card', 'lead']) if (!a[k] || typeof a[k] !== 'string') w(`${k} 없음`);
    if (a.desc && (a.desc.length < 50 || a.desc.length > 170)) w(`description 길이 ${a.desc.length}자 (50~170자)`);
    if (a.metaTitle && a.metaTitle.length > 60) warns.push(`[${a.slug}] metaTitle ${a.metaTitle.length}자 — 검색 결과에서 잘릴 수 있음`);
    if (a.published && !/^\d{4}-\d{2}-\d{2}$/.test(a.published)) w('published는 YYYY-MM-DD');
    if (a.modified && !/^\d{4}-\d{2}-\d{2}$/.test(a.modified)) w('modified는 YYYY-MM-DD');
    if (a.published && a.modified && a.modified < a.published) w('modified가 published보다 빠름');
    if (!Array.isArray(a.sections) || a.sections.length < 4) w('섹션(H2)은 4개 이상');
    if (!Array.isArray(a.summary) || a.summary.length < 3 || a.summary.length > 5) w('핵심 요약은 3~5개');
    if (!Array.isArray(a.related) || a.related.length < 3 || a.related.length > 4) w('related는 3~4개');
    else for (const r of a.related) {
      if (!slugs.has(r)) w(`related에 없는 글: ${r}`);
      if (r === a.slug) w('related에 자기 자신');
    }
    if (Array.isArray(a.sections)) {
      const types = new Set(a.sections.flatMap((s) => s.blocks.map((b) => b.t)));
      if (!['ul', 'ol', 'check', 'table', 'ex'].some((t) => types.has(t))) w('목록/표/체크리스트/예시 중 하나는 필요');
      const text = textOf(a);
      if (text.length < 600) w(`본문이 너무 짧음(${text.length}자). 독자의 질문에 충분히 답했는지 확인`);
      else if (text.length < 1500) warns.push(`[${a.slug}] 본문 ${text.length}자 — 사례·직접 확인한 사실·체크리스트를 더해 보강 권장(분량 자체가 목표는 아님)`);
      for (const [re, why] of BANNED) if (re.test(text) || re.test(a.title + a.desc)) w(`금지 표현: ${why}`);
    }
    for (const [key, val] of [['slug', a.slug], ['title', a.title], ['metaTitle', a.metaTitle], ['desc', a.desc]]) {
      if (seen[key].has(val)) w(`${key} 중복: ${seen[key].get(val)}와 동일`);
      else seen[key].set(val, a.slug);
    }
  }
  // 주제 유사도(서로 거의 같은 글 방지)
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const t = sim(all[i].title, all[j].title), d = sim(all[i].desc, all[j].desc);
    // 같은 형식의 시리즈(예: 업종별 아이디어 20가지)는 제목이 비슷할 수 있으므로 제목 기준은 느슨하게 둔다
    if (t > 0.8 || d > 0.6) errs.push(`[${all[j].slug}] ${all[i].slug}와 주제가 거의 같음(title ${t.toFixed(2)}, desc ${d.toFixed(2)}). 합치거나 다른 질문에 답하도록 바꾸세요`);
  }
  // 다른 글의 related에서 한 번도 안 걸리는 글 안내
  const incoming = new Map(all.map((a) => [a.slug, 0]));
  for (const a of all) for (const r of a.related || []) if (incoming.has(r)) incoming.set(r, incoming.get(r) + 1);
  for (const [s, n] of incoming) if (!n) warns.push(`[${s}] 다른 글의 related에 연결되지 않음 (같은 카테고리 더보기, 이전/다음, 허브로는 연결됨)`);
  return { errs, warns };
}
