// 4b 전후 비교 화면 HTML 만들기: dev/snapshots/compare-4b.html (브라우저로 열어 보면 됨)
import fs from 'node:fs';
import path from 'node:path';
import { root } from '../lib/harness.mjs';

const dir = path.join(root, 'dev', 'snapshots');
const has = (d, f) => fs.existsSync(path.join(dir, d, f));
const img = (d, f) => (has(d, f) ? `<a href="${d}/${encodeURIComponent(f)}" target="_blank"><img loading="lazy" src="${d}/${encodeURIComponent(f)}" alt="${f}"></a>` : '<div class="none">(이 화면은 없었어요)</div>');
const ROWS = [
  ['홈 (처음 화면)', '01-시작', '01-시작', '모드 탭 4개·긴 소개·"이렇게 나와요" 칸이 사라지고 ☰ 메뉴가 생겼어요. 업종이 맨 위에 보여요.'],
  ['1단계 입력 (예시 가게)', '02-1단계-입력(보리당)', '02-1단계-입력(보리당)', 'PC에서는 오른쪽 "지금 설정" 카드가 없어지고 폼이 가운데에 모여요.'],
  ['3단계 (그림·저장·올리기)', '04-3단계-그림저장(보리당)', '04-3단계-그림저장(보리당)', '"스토리·릴스 탭 →" 바로가기가 사라졌어요.'],
  ['한 달 기획', '05-한달기획', '05-한달기획', '위쪽 탭 대신 ☰ 메뉴에서 열어요(화면은 그대로).'],
];
const NEW = [
  ['☰ 메뉴 열림', '11-메뉴열림', '맨 위 빈 자리(#shopSlot)는 지금 아무것도 그리지 않아요. 지금 보는 항목은 검정 글씨 + 왼쪽 선.'],
  ['메뉴: 한 달 기획 표시', '12-메뉴-한달기획표시', '한 달 기획 화면에서는 표시가 "한 달 기획"으로 옮겨가요.'],
  ['백업 창', '13-백업창', '메뉴의 "백업 저장 · 불러오기"나 머리말 저장 상태를 누르면 열려요.'],
  ['3단계: "이 편까지 백업 저장" 안내', '14-3단계-백업안내', '그림을 다 올리거나 캡션을 복사하면 편마다 한 번.'],
  ['새 기기 홈', '15-새기기-홈', '저장된 작업이 없을 때만 "다른 기기에서 쓰던 작업이 있나요?" 한 줄.'],
  ['인스타툰 노트 목록: 맨 위', '16-노트목록-맨위', '홈과 로고 위치가 같아요.'],
  ['인스타툰 노트 목록: ☰ 메뉴', '16-노트목록-메뉴열림', '노트 글·소개·개인정보·이용안내·404 페이지에도 같은 메뉴가 있어요.'],
  ['인스타툰 노트 글: ☰ 메뉴', '17-노트글-메뉴열림', ''],
];
const GONE = [['스토리·릴스 (없앰)', '06-릴스'], ['반응·댓글 (없앰)', '07-반응분석']];
const sec = (t, note, cells) => `<section><h2>${t}</h2>${note ? `<p class="note">${note}</p>` : ''}<div class="grid">${cells}</div></section>`;
let body = '';
for (const [t, b, a, note] of ROWS) body += sec(t, note, ['m', 'pc'].map((v) => `<div class="pair"><div><h3>전 · ${v === 'm' ? '휴대폰' : 'PC'}</h3>${img('4b-before', `${v}-${b}.jpg`)}</div><div><h3>후 · ${v === 'm' ? '휴대폰' : 'PC'}</h3>${img('4b-after', `${v}-${a}.jpg`)}</div></div>`).join(''));
body += '<h1 class="sub">새로 생긴 화면</h1>';
for (const [t, f, note] of NEW) body += sec(t, note, ['m', 'pc'].map((v) => `<div><h3>${v === 'm' ? '휴대폰' : 'PC'}</h3>${img('4b-after', `${v}-${f}.jpg`)}</div>`).join(''));
body += '<h1 class="sub">없앤 화면 (전)</h1>';
for (const [t, f] of GONE) body += sec(t, '데이터는 그대로 남고, 화면과 기능만 없어졌어요.', ['m', 'pc'].map((v) => `<div><h3>${v === 'm' ? '휴대폰' : 'PC'} · 전</h3>${img('4b-before', `${v}-${f}.jpg`)}</div>`).join(''));
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>4b 전후 비교</title>
<style>body{font:15px/1.6 system-ui,"Malgun Gothic",sans-serif;margin:0;padding:24px;background:#f6f6f4;color:#111}h1{font-size:22px}h1.sub{margin:48px 0 0;border-top:3px solid #111;padding-top:18px}h2{font-size:18px;margin:34px 0 4px}h3{font-size:13px;margin:0 0 6px;color:#555}.note{margin:0 0 12px;color:#555}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:20px;align-items:start}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%;height:auto;border:1px solid #ddd;border-radius:8px;background:#fff;display:block;max-height:1150px;object-fit:cover;object-position:top}.none{padding:30px;border:1px dashed #bbb;border-radius:8px;color:#888;text-align:center}
@media(max-width:900px){.grid{grid-template-columns:1fr}}</style><h1>4b 전후 비교 · ☰ 메뉴와 홈 간소화</h1><p class="note">이미지를 누르면 크게 열려요. 왼쪽 열이 휴대폰, 오른쪽 열이 PC예요.</p>${body}</html>`;
fs.writeFileSync(path.join(dir, 'compare-4b.html'), html); console.log('비교 화면:', path.join(dir, 'compare-4b.html'));
