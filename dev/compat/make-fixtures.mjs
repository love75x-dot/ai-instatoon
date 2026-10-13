// 호환 검사용 "옛 형식" 고정 데이터를 만든다. 리뉴얼 0단계(현재 코드) 기준으로 딱 한 번 만들고 그대로 보존한다.
// 이후 코드로 다시 만들면 검사의 의미가 사라지므로, 이미 있으면 --force 없이는 만들지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const dir = path.join(root, 'dev', 'compat', 'fixtures');
if (fs.existsSync(path.join(dir, 'ls-full.json')) && !process.argv.includes('--force')) { console.log('이미 있어요. 정말 새로 만들려면 --force'); process.exit(0); }
fs.mkdirSync(dir, { recursive: true });
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const write = (n, o) => fs.writeFileSync(path.join(dir, n), JSON.stringify(o, null, 2) + '\n');

const srv = await serve(); const browser = await launch();
const { page, errors } = await newPage(browser, srv.base);
await page.goto(srv.base + '/'); await page.waitForTimeout(500);

// 1) 현재 형식 전체 localStorage (보리당 작업 + 사진·기준 이미지·샘플·복사 표시·설정·관리자 키)
const ls = await page.evaluate(({ PNG, JPG }) => {
  S = demoState('bakery'); S.step = 'post'; S.info.ratio = '3:4';
  S.toon.pics = [JPG, JPG, PNG]; S.toon.hid = 'h-fixture-1'; S.toon.zipped = true;
  S.history = [{ hid: 'h-fixture-1', title: S.toon.title, date: '2026-09-30', thumb: JPG, art: 'chibi', tone: 'warm', cuts: 6, type: 'daily', goal: '방문', hook: '', link: '', stats: { reach: 120, like: 10, cmt: 2, save: 5, share: 1 } }];
  S.month.items.forEach((it, i) => { if (i < 2) it.who = '알바생'; });
  S.profile.logo = PNG; S.planRef = null;
  const o = {};
  o['instatoonRoom.v4'] = JSON.stringify(S);
  o['instatoon.key'] = 'TEST-KEY-NOT-REAL'; o['instatoon.textModel'] = 'gemini-3.5-flash'; o['instatoon.imageModel'] = 'gemini-3.1-flash-image';
  o['instatoon.helpSeen'] = '1'; o['instatoon.photo.0'] = JPG; o['instatoon.photo.1'] = PNG;
  o['instatoon.charRef'] = JPG; o['instatoon.charRef2'] = PNG; o['instatoon.sample.chibi'] = JPG; o['instatoon.sample.mono'] = PNG;
  o['instatoon.copied'] = JSON.stringify(['setup', 'cut-0', 'cut-1', 'sheet-0']);
  o['instatoon.demoBackup'] = JSON.stringify(blank());
  o['instatoon.admin.pw'] = JSON.stringify({ salt: 'abc', hash: 'def' });
  o['instatoon.admin.prompts'] = JSON.stringify({});
  o['instatoon.admin.manual'] = JSON.stringify({});
  o['instatoon.admin.arts'] = JSON.stringify({ over: {}, custom: {}, hidden: [] });
  return o;
}, { PNG, JPG });
write('ls-full.json', ls);

// 2) 아주 옛 v3 형식
write('ls-legacy-v3.json', { 'instatoonRoom.v3': { info: { type: '카페', name: '옛카페', notes: '옛 이야기 메모', offer: '아메리카노 500원 할인', target: '직장인', action: '저장' } } });

// 3) 잔재 필드가 남은 v4 (새 필드 일부가 없는 옛 작업)
const legacy = JSON.parse(ls['instatoonRoom.v4']);
Object.assign(legacy.info, { style: 'band', letterMode: 'custom', fonts: { title: 'Jua', bubble: 'Gaegu', sfx: 'Dokdo' }, titleScale: 1.2, tTilt: 2, titleColor: '#ff0', tOutline: 3, hl: true, hlColor: '#ff0', tShadow: true, textInImg: false });
delete legacy.info.ratio; delete legacy.info.fit; delete legacy.endcard; delete legacy.reuse; delete legacy.statsAI;
legacy.toon.cuts.forEach((c) => { c.img = JPG; });
Object.assign(legacy.toon, { kit: { x: 1 }, pre: { y: 1 }, postedAt: '2026-09-01' });
write('ls-legacy-v4.json', { 'instatoonRoom.v4': JSON.stringify(legacy) });

// 4) 백업 파일 (현재 앱의 "백업 저장"이 실제로 만든 파일)
await page.goto(srv.base + '/'); // 새로 시작
await page.evaluate(async (ls) => {
  localStorage.clear(); Object.entries(ls).forEach(([k, v]) => localStorage.setItem(k, v));
  S = load(); charRef = localStorage.getItem('instatoon.charRef'); extraRefs[1] = localStorage.getItem('instatoon.charRef2');
  await idbPut({ f: '테스트폰트', buf: new Uint8Array([1, 2, 3, 4, 5, 250]).buffer });
}, ls);
const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => makeBackup())]);
const bp = path.join(dir, 'backup-v1.json'); await dl.saveAs(bp);
const b = JSON.parse(fs.readFileSync(bp, 'utf8')); b.savedAt = '2026-10-13T00:00:00.000Z'; write('backup-v1.json', b);

// 5) 위 데이터를 현재 코드로 불러왔을 때의 기대값 (S 와 프롬프트)
const snap = async (name, seed) => {
  const { page: p, errors: er } = await newPage(browser, srv.base, { ls: seed });
  await p.goto(srv.base + '/'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), prompts: { setup: setupPrompt(), cuts: cuts().map((c, i) => cutPrompt(c, i)), end: endPrompt(), sheets: peopleIdx().map((k) => sheetPrompt(k)) } }));
  if (er.length) throw new Error(name + ' 오류: ' + er[0]);
  return r;
};
const expected = { full: await snap('full', ls), v3: await snap('v3', JSON.parse(fs.readFileSync(path.join(dir, 'ls-legacy-v3.json'), 'utf8'))), v4legacy: await snap('v4legacy', JSON.parse(fs.readFileSync(path.join(dir, 'ls-legacy-v4.json'), 'utf8'))) };
write('expected.json', expected);
await browser.close(); srv.close();
if (errors.length) { console.log('페이지 오류', errors); process.exit(1); }
console.log('고정 데이터 생성:', fs.readdirSync(dir).join(', '));
