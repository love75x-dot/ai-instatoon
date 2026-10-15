// 4b 전후 비교 화면 HTML 만들기: dev/snapshots/compare-4b.html (브라우저로 열어 보면 됨)
//   4b-before = 4b 전(원래 화면) · 4b-v1 = 처음 올린 4b 미리보기(폭이 들쭉날쭉했던 것) · 4b-after = 폭 맞추기·2열·키 줄 문구를 고친 지금 화면
import fs from 'node:fs';
import path from 'node:path';
import { root } from '../lib/harness.mjs';

const dir = path.join(root, 'dev', 'snapshots');
const has = (d, f) => fs.existsSync(path.join(dir, d, f));
const img = (d, f) => (has(d, f) ? `<a href="${d}/${encodeURIComponent(f)}" target="_blank"><img loading="lazy" src="${d}/${encodeURIComponent(f)}" alt="${f}"></a>` : '<div class="none">(없음)</div>');
const cell = (title, d, f) => `<div class="c"><h3>${title}</h3>${img(d, f)}</div>`;
const sec = (t, note, cells, cls = '') => `<section><h2>${t}</h2>${note ? `<p class="note">${note}</p>` : ''}<div class="grid ${cls}">${cells}</div></section>`;

// 1) 이번 수정: 수정 전(처음 올린 미리보기) 휴대폰·PC, 수정 후 휴대폰·태블릿·PC
const FIX = [
  ['홈 (처음 화면)', '01-시작', '위쪽 줄(API 키 줄·단계 탭)과 입력 상자의 왼쪽·오른쪽 끝선이 같아졌고, PC·태블릿은 입력칸이 2열이에요. 키 줄 문구도 바뀌었어요.'],
  ['1단계 입력 (예시 가게)', '02-1단계-입력(보리당)', '예시 가게는 주인공이 2명이라 "더 설정하기"가 펼쳐진 상태예요. 펼친 칸은 가로 전체로 넓어져요.'],
  ['2단계 (컷 편집)', '03-2단계-컷편집(보리당)', '왼쪽 편집 칸 + 오른쪽 스토리보드가 위쪽 줄과 같은 폭이에요.'],
  ['3단계 (그림·저장·올리기)', '04-3단계-그림저장(보리당)', '그림을 올리기 전에는 본문이 위쪽 줄과 같은 폭으로 꽉 차요.'],
  ['한 달 기획', '05-한달기획', ''],
];
let body = '<h1>이번 수정 · 폭 맞추기 · 2열 · API 키 줄 문구</h1><p class="note">왼쪽부터 수정 전 휴대폰 · 수정 후 휴대폰 · 수정 후 태블릿(768px) · 수정 전 PC · 수정 후 PC(1300px). 이미지를 누르면 크게 열려요.</p>';
for (const [t, f, note] of FIX) body += sec(t, note, [cell('전 · 휴대폰', '4b-v1', `m-${f}.jpg`), cell('후 · 휴대폰 390', '4b-after', `m-${f}.jpg`), cell('후 · 태블릿 768', '4b-after', `t-${f}.jpg`), cell('전 · PC', '4b-v1', `pc-${f}.jpg`), cell('후 · PC 1300', '4b-after', `pc-${f}.jpg`)].join(''), 'five');
body += sec('API 키 줄 — 키가 없고 맛보기가 켜져 있을 때', '"무료 맛보기로 바로 만들 수 있어요 · 내 키 넣기(선택)". 겁주는 "필요해요"가 없어요.', ['m', 't', 'pc'].map((v) => cell(v === 'm' ? '휴대폰 390' : v === 't' ? '태블릿 768' : 'PC 1300', '4b-after', `${v}-18-키줄-맛보기켜짐.jpg`)).join(''), 'three');
body += sec('API 키 줄 — 키가 있을 때', '지금처럼 "연결됨 ✓".', ['m', 't', 'pc'].map((v) => cell(v === 'm' ? '휴대폰 390' : v === 't' ? '태블릿 768' : 'PC 1300', '4b-after', `${v}-20-키줄-연결됨.jpg`)).join(''), 'three');
body += sec('API 키 줄 — 맛보기가 꺼져 있을 때만', '서버 설정 문제 등으로 맛보기를 쓸 수 없을 때만 "API 키가 필요해요". (미리보기 주소는 비밀값이 없어서 이 상태로 보여요. 운영 주소는 맛보기가 켜져 있어요.)', ['m', 't', 'pc'].map((v) => cell(v === 'm' ? '휴대폰 390' : v === 't' ? '태블릿 768' : 'PC 1300', '4b-after', `${v}-19-키줄-맛보기꺼짐.jpg`)).join(''), 'three');

// 2) 4b에서 새로 생긴 화면(수정 후, 세 크기)
body += '<h1 class="sub">4b에서 새로 생긴 화면 (수정 후)</h1>';
const NEW = [
  ['☰ 메뉴 열림', '11-메뉴열림', '맨 위 빈 자리(#shopSlot)는 지금 아무것도 그리지 않아요. 지금 보는 항목은 검정 글씨 + 왼쪽 선.'],
  ['메뉴: 한 달 기획 표시', '12-메뉴-한달기획표시', ''],
  ['백업 창', '13-백업창', '메뉴의 "백업 저장 · 불러오기"나 머리말 저장 상태를 누르면 열려요.'],
  ['3단계: "이 편까지 백업 저장" 안내', '14-3단계-백업안내', '그림을 다 올리거나 캡션을 복사하면 편마다 한 번.'],
  ['새 기기 홈', '15-새기기-홈', '저장된 작업이 없을 때만 "다른 기기에서 쓰던 작업이 있나요?" 한 줄.'],
  ['인스타툰 노트 목록: ☰ 메뉴', '16-노트목록-메뉴열림', '노트 글·소개·개인정보·이용안내·404에도 같은 메뉴가 있어요.'],
];
for (const [t, f, note] of NEW) body += sec(t, note, ['m', 't', 'pc'].map((v) => cell(v === 'm' ? '휴대폰 390' : v === 't' ? '태블릿 768' : 'PC 1300', '4b-after', `${v}-${f}.jpg`)).join(''), 'three');
body += '<h1 class="sub">없앤 화면 (4b 전)</h1>';
for (const [t, f] of [['스토리·릴스', '06-릴스'], ['반응·댓글', '07-반응분석']]) body += sec(t, '데이터는 그대로 남고, 화면과 기능만 없어졌어요.', ['m', 'pc'].map((v) => cell(v === 'm' ? '휴대폰' : 'PC', '4b-before', `${v}-${f}.jpg`)).join(''), 'two');

const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>4b 전후 비교</title>
<style>body{font:15px/1.6 system-ui,"Malgun Gothic",sans-serif;margin:0;padding:24px;background:#f6f6f4;color:#111}h1{font-size:22px}h1.sub{margin:56px 0 0;border-top:3px solid #111;padding-top:18px}h2{font-size:18px;margin:34px 0 4px}h3{font-size:13px;margin:0 0 6px;color:#555}.note{margin:0 0 12px;color:#555}
.grid{display:grid;gap:14px;align-items:start}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.three{grid-template-columns:repeat(3,minmax(0,1fr))}.two{grid-template-columns:repeat(2,minmax(0,1fr))}
img{width:100%;height:auto;border:1px solid #ddd;border-radius:8px;background:#fff;display:block;max-height:1150px;object-fit:cover;object-position:top}.none{padding:30px;border:1px dashed #bbb;border-radius:8px;color:#888;text-align:center}
@media(max-width:1000px){.five,.three,.two{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>${body}</html>`;
fs.writeFileSync(path.join(dir, 'compare-4b.html'), html); console.log('비교 화면:', path.join(dir, 'compare-4b.html'));
