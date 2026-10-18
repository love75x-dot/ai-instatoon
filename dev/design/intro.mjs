// 소개 화면(처음 온 사람) 검사: 첫 방문/재방문 판단, 시작 버튼, 새로고침, #intro 링크, 가로 스크롤, 보관함 고르기 위치
import assert from 'node:assert/strict';
import { serve, launch, newPage } from '../lib/harness.mjs';

const srv = await serve(), browser = await launch(); let fails = 0;
const ok = (c, m) => { try { assert.ok(c, m); console.log('✓', m); } catch { fails++; console.log('✗', m); } };
const introOn = (p) => p.evaluate(() => document.documentElement.classList.contains('intro'));
const vis = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && e.getClientRects().length > 0; }, sel);
const M = { width: 390, height: 844 };
const preN = (p) => p.evaluate(() => document.querySelectorAll('link[rel=preload][href*="/pretendard/"]').length);

// 1) 처음 온 사람: 소개가 보이고 앱은 숨겨짐, 가로 스크롤 없음
{
  const { page, errors } = await newPage(browser, srv.base, { intro: true, viewport: M });
  await page.goto(srv.base + '/'); await page.waitForTimeout(600);
  ok(await introOn(page) && await vis(page, '#intro h1') && !await vis(page, '#main'), '처음 온 사람: 소개 화면이 보이고 만들기 화면은 숨겨져요');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '390px: 가로 스크롤 없음');
  ok(await preN(page) === 0, '처음 온 사람: 앱용 Pretendard 글꼴은 미리 불러오지 않아요(성능)');
  ok(await page.title() === '인스타툰 연재실', 'title 유지');
  // 시작 → 만들기 화면, 새로고침해도 소개로 안 돌아감
  await page.click('#intro .in-hero [data-intro="start"]'); await page.waitForTimeout(400);
  ok(!await introOn(page) && await vis(page, '#main'), '[내 이야기로 시작하기] → 만들기 화면');
  ok(await page.evaluate(() => /웹툰 만들기/.test(document.querySelector('#main h1')?.textContent || '')), '만들기 화면 제목: 웹툰 만들기');
  await page.reload(); await page.waitForTimeout(600);
  ok(!await introOn(page) && await vis(page, '#main'), '저장 전 새로고침해도 소개로 안 튕겨요');
  // #intro 링크로 다시 보기
  await page.goto(srv.base + '/#intro'); await page.waitForTimeout(500);
  ok(await introOn(page), '#intro 주소로 소개를 다시 볼 수 있어요');
  ok(errors.length === 0, '콘솔 오류 없음 ' + errors.join('|').slice(0, 120));
}
// 2) 업종 칩: 업종 미리 선택
{
  const { page } = await newPage(browser, srv.base, { intro: true, viewport: M });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  await page.click('#intro .in-chip[data-ind="카페"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => document.querySelector('[data-ind="카페"]')?.getAttribute('aria-pressed') === 'true'), '업종 칩 "카페" → 만들기 화면에 카페가 골라져 있어요');
}
// 3) 재방문자: 저장된 작업이 있으면 바로 작업 화면, ☰ 메뉴의 소개로 다시 보기
{
  const st = { step: 'input', info: { type: '카페', name: '보리당', story: '있었던 일' } };
  const { page } = await newPage(browser, srv.base, { intro: true, viewport: M, ls: { 'instatoonRoom.v4': JSON.stringify(st) } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(800);
  ok(!await introOn(page) && await vis(page, '#main'), '재방문자: 소개 없이 작업 화면');
  ok(await preN(page) === 12, '재방문자: 앱용 Pretendard 글꼴 12개를 그대로 미리 불러와요');
  await page.click('#menuBtn'); await page.waitForTimeout(300);
  await page.click('#menuPanel a[href="#intro"]'); await page.waitForTimeout(500);
  ok(await introOn(page), '☰ 메뉴 "소개"로 소개 화면을 다시 봐요');
  await page.click('#intro .in-top [data-intro="start"]'); await page.waitForTimeout(400);
  ok(!await introOn(page) && await page.evaluate(() => document.querySelector('#i-name')?.value === '보리당'), '다시 시작하기 → 내 작업 그대로');
}
// 4) 예시 넘기기: 탭 3개(편의점·반찬가게·수제버거, 편의점은 site/intro.config.json 로 켜고 끔), 처음엔 반찬가게, 6컷
{
  const { page } = await newPage(browser, srv.base, { intro: true, viewport: M });
  const cfg = JSON.parse((await import('node:fs')).readFileSync(new URL('../../site/intro.config.json', import.meta.url), 'utf8')), on = cfg.convenienceStore === true;
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => [...document.querySelectorAll('#intro .in-tab')].map((t) => t.dataset.story + ':' + t.getAttribute('aria-selected')).join()) === (on ? 'cvs:false,banchan:true,burger:false' : 'banchan:true,burger:false'), '예시 탭 구성과 처음 선택(반찬가게)이 설정(편의점 ' + (on ? '켜짐' : '꺼짐') + ')과 맞아요');
  ok(await page.evaluate(() => document.querySelectorAll('#intro .in-card').length) === (on ? 3 : 2), '첫 화면 피드 카드 수가 설정과 맞아요');
  await page.click('#intro .in-tab[data-story="burger"]'); await page.click('#in-next');
  ok(await page.evaluate(() => document.querySelector('#intro .in-no').textContent.startsWith('02') && /burger2/.test(document.querySelector('#intro .in-stage img').src)), '수제버거 탭/넘기기 동작');
  if (on) { await page.click('#intro .in-tab[data-story="cvs"]'); await page.waitForTimeout(200); ok(await page.evaluate(() => /ex-cvs1/.test(document.querySelector('#intro .in-stage img').src) && document.querySelector('#intro .in-no').textContent.startsWith('01')), '편의점 탭: 1컷부터 보임'); }
  else ok(!await page.evaluate(() => /편의점/.test(document.getElementById('intro').innerHTML)), '끄기 상태: 편의점 글이 소개 화면에 없어요');
}
await browser.close(); srv.close();
if (fails) { console.log(`\n실패 ${fails}개`); process.exit(1); } console.log('\n소개 화면 검사 통과');
