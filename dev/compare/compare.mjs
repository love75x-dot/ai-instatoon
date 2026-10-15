// 4c 비교 스크립트: 보리당 예시로 (1) 원래 지시문 vs 짧은 지시문, (2) Gemini·Groq·OpenRouter 세 서비스의 대본 결과를 나란히 본다.
// 키는 이 PC의 환경변수로만 읽고(파일·채팅에 남기지 않음) 결과 HTML에도 키는 들어가지 않는다. 사이트 Worker와 같은 호출 코드를 쓴다.
//
// 실행 (PowerShell, 가진 키만 넣으면 됨. 창을 닫으면 키도 사라진다):
//   cd D:\claude-projects\ai-instatoon\instatoon_handoff
//   $env:GEMINI_KEY = "붙여넣기"
//   $env:GROQ_KEY = "붙여넣기"
//   $env:OPENROUTER_KEY = "붙여넣기"
//   npm run compare
// 옵션: --only=gemini,groq   --variants=long,short   --fake(가짜 응답으로 화면만 확인, 키 필요 없음)
// 모델 바꾸기: $env:GEMINI_MODELS = "gemini-3.1-flash-lite,gemini-3.5-flash"  /  $env:GROQ_MODELS = "openai/gpt-oss-120b,qwen/qwen3-32b"  /  $env:OPENROUTER_MODELS = "openrouter/free"
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { root, serve, launch, newPage } from '../lib/harness.mjs';
import { PROVIDERS, config, extractJson } from '../../worker/core.js';

const arg = (k, d) => (process.argv.find((a) => a.startsWith('--' + k + '=')) || '').split('=')[1] || d;
const FAKE = process.argv.includes('--fake');
const only = arg('only', 'gemini,groq,openrouter').split(',');
const variants = arg('variants', 'long,short').split(',');
const env = { GEMINI_KEY: process.env.GEMINI_KEY, GROQ_KEY: process.env.GROQ_KEY, OPENROUTER_KEY: process.env.OPENROUTER_KEY, GROQ_REASONING: process.env.GROQ_REASONING };
const MODELS = {
  gemini: (process.env.GEMINI_MODELS || 'gemini-3.1-flash-lite').split(','),
  groq: (process.env.GROQ_MODELS || 'openai/gpt-oss-120b').split(','),
  openrouter: (process.env.OPENROUTER_MODELS || 'openrouter/free').split(','),
};

// 1) 보리당 예시로 앱이 실제로 보내는 요청 문장을 뽑는다(원래 판·짧은 판)
const srv = await serve(); const browser = await launch();
const { page } = await newPage(browser, srv.base);
await page.goto(srv.base + '/'); await page.waitForTimeout(600);
const prompts = await page.evaluate(async () => {
  let got = null; const real = ask; ask = async (p) => { got = p; throw { code: 'stub' }; };
  const grab = async () => { got = null; await makeToon(); return got; };
  S = demoState('bakery'); S.mode = 'one'; PACK_FORCE = false; const long = await grab(); PACK_FORCE = true; const short = await grab(); PACK_FORCE = null; ask = real;
  return { long, short };
});
await browser.close(); srv.close();

// 2) 호출
const cannedBubble = (n) => '사장님: 안녕하세요, 보리당이에요 ' + n;
const fakeText = (name, v) => JSON.stringify({ title: `(가짜) ${name} ${v}`, tone: '따뜻함', cuts: [1, 2, 3, 4, 5, 6].map((k) => ({ role: '장면' + k, shot: '미디엄샷', title: k === 1 ? '오늘도\n문 열었어요' : '', highlight: '', sub: '', bubble: cannedBubble(k), bubbleSide: 'l', sfx: '', direction: '가게 안 장면 ' + k, panels: '', caption: '', extras: '' })), hooks: ['a', 'b', 'c'], caption: '가짜 캡션', hashtags: '#a #b #c #d #e', comment: '댓글', reelCaption: '', reelHashtags: '', reelComment: '', endHead: '', endBtn: '', cast: '', ideas: ['x', 'y', 'z'], memory: { story: '가짜 줄거리', threads: [], tone: '' } });
const results = [];
for (const name of ['gemini', 'groq', 'openrouter']) {
  if (!only.includes(name)) continue;
  if (!FAKE && !env[name.toUpperCase() + '_KEY']) { console.log(`- ${name}: 키가 없어 건너뜀`); continue; }
  for (const model of MODELS[name]) for (const v of variants) {
    const cfg = config(env); cfg.models[name] = model.trim();
    const t0 = Date.now(); let r;
    if (FAKE) r = { ok: true, text: fakeText(name, v) };
    else { try { r = await PROVIDERS[name](env, cfg, prompts[v], fetch, 120000); } catch (e) { r = { ok: false, err: String(e && e.message || e) }; } }
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    const j = r.ok ? extractJson(r.text) : null;
    results.push({ name, model, v, r, j, sec, inChars: prompts[v].length });
    console.log(`- ${name} / ${model} / ${v === 'long' ? '원래 판' : '짧은 판'}: ${r.ok ? (j ? `JSON 확인 · ${sec}초` : 'JSON이 아님') : r.rate ? '한도에 걸림(잠시 뒤 다시)' : '실패'}`);
    if (!FAKE) await new Promise((res) => setTimeout(res, 2500));
  }
}

// 3) 화면
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stats = (j) => {
  if (!j) return null; const cuts = Array.isArray(j.cuts) ? j.cuts : []; const lines = cuts.flatMap((c) => String(c.bubble || '').split('\n').filter(Boolean));
  const long = lines.filter((l) => l.replace(/^[^:：]*[:：]\s*/, '').length > 18).length;
  return { cuts: cuts.length, lines: lines.length, long, tags: String(j.hashtags || '').split(/\s+/).filter(Boolean).length, cap: String(j.caption || '').length };
};
const cell = (x) => {
  if (!x.r.ok) return `<div class="bad">${x.r.rate ? '한도에 걸렸어요(잠시 뒤 다시)' : '실패'}</div>`;
  if (!x.j) return `<div class="bad">JSON이 아니에요</div><pre>${esc(String(x.r.text).slice(0, 1200))}</pre>`;
  const j = x.j, cuts = Array.isArray(j.cuts) ? j.cuts : [];
  return `<h4>${esc(j.title)} <small>${esc(j.tone)}</small></h4>` + cuts.map((c, i) => `<div class="cut"><b>${i + 1}컷</b> <i>${esc(c.role)} · ${esc(c.shot)}</i>${c.title ? `<div class="t">${esc(c.title).replace(/\n/g, '<br>')}</div>` : ''}<div class="b">${esc(c.bubble).replace(/\n/g, '<br>')}</div><div class="d">${esc(c.direction)}</div>${c.sfx ? `<div class="d">효과음 ${esc(c.sfx)}</div>` : ''}</div>`).join('')
    + `<div class="cap"><b>캡션</b><br>${esc(j.caption).replace(/\n/g, '<br>')}<br><b>해시태그</b> ${esc(j.hashtags)}<br><b>댓글</b> ${esc(j.comment).replace(/\n/g, '<br>')}</div>`;
};
const groups = [...new Set(results.map((x) => x.name + ' / ' + x.model))];
const sumRows = results.map((x) => { const s = stats(x.j); return `<tr><td>${esc(x.name)} / ${esc(x.model)}</td><td>${x.v === 'long' ? '원래 판' : '짧은 판'}</td><td>${x.inChars.toLocaleString()}자</td><td>${x.r.ok ? (x.j ? '✓' : '✗ JSON 아님') : '✗ 실패'}</td><td>${s ? s.cuts : '-'}</td><td>${s ? s.lines + ' (18자 넘는 것 ' + s.long + ')' : '-'}</td><td>${s ? s.tags : '-'}</td><td>${s ? s.cap + '자' : '-'}</td><td>${x.sec}초</td></tr>`; }).join('');
const body = groups.map((g) => { const rows = results.filter((x) => x.name + ' / ' + x.model === g);
  return `<section><h2>${esc(g)}</h2><div class="cols">${rows.map((x) => `<div class="col"><h3>${x.v === 'long' ? '원래 판 (지금 문장)' : '짧은 판 (무료 경로용 안)'} <small>요청 ${x.inChars.toLocaleString()}자</small></h3>${cell(x)}</div>`).join('')}</div></section>`; }).join('');
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>대본 비교 · 보리당</title>
<style>body{font:15px/1.6 system-ui,"Malgun Gothic",sans-serif;margin:0;padding:24px;background:#f6f6f4;color:#111}h1{font-size:22px}h2{font-size:18px;margin:34px 0 10px;border-top:2px solid #111;padding-top:14px}h3{font-size:15px;margin:0 0 8px}h4{margin:6px 0 10px}small{color:#666;font-weight:400}
table{border-collapse:collapse;background:#fff;font-size:13.5px}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f0f0ee}.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px}.col{background:#fff;border:1px solid #ddd;border-radius:12px;padding:14px}
.cut{border-top:1px solid #eee;padding:8px 0}.cut i{color:#777;font-style:normal;font-size:12.5px}.t{font-weight:800;margin-top:3px}.b{margin-top:3px}.d{color:#666;font-size:13px}.cap{background:#fafaf8;border-radius:8px;padding:10px;margin-top:10px;font-size:13.5px}.bad{color:#b00020;font-weight:700}pre{white-space:pre-wrap;font-size:12px;background:#fafaf8;padding:8px}</style>
<h1>대본 비교 · 보리당 예시 ${FAKE ? '<small>(가짜 응답 — 화면 확인용)</small>' : ''}</h1>
<p>같은 입력(보리당 예시)으로 만든 결과예요. 요청 문장 길이: 원래 판 ${prompts.long.length.toLocaleString()}자 / 짧은 판 ${prompts.short.length.toLocaleString()}자 (${Math.round((1 - prompts.short.length / prompts.long.length) * 100)}% 짧음). 출력 형식(컷 데이터)은 같은 지시예요.</p>
<table><tr><th>서비스 / 모델</th><th>판</th><th>요청 길이</th><th>결과</th><th>컷 수</th><th>말풍선</th><th>해시태그</th><th>캡션</th><th>걸린 시간</th></tr>${sumRows}</table>${body}</html>`;
const out = path.join(root, 'dev', 'compare', 'out'); fs.mkdirSync(out, { recursive: true });
const file = path.join(out, '비교_보리당.html'); fs.writeFileSync(file, html);
console.log('\n결과 파일: ' + file);
if (process.platform === 'win32' && !process.argv.includes('--no-open')) exec(`start "" "${file}"`);
