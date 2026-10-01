const { chromium } = require('playwright');
const zlib=require('zlib');
function png(w,h,v){const raw=Buffer.alloc((w*3+1)*h,v);for(let y=0;y<h;y++)raw[y*(w*3+1)]=0;const crc=(b)=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0};const ch=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]).toString('base64')}
const IMG=png(700,700,0xA0);
let imgPrompts=[];
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1300,height:1000},acceptDownloads:true}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,body:''}));
  await p.route('**generativelanguage.googleapis.com/**',async r=>{
    const body=JSON.parse(r.request().postData()); const t=body.contents[0].parts[0].text||'';
    if(body.generationConfig.responseModalities){ imgPrompts.push(t); return r.fulfill({json:{candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:IMG}}]}}]}}); }
    r.fulfill({json:{candidates:[{content:{parts:[{text:'{}'}]}}]}});
  });
  await p.addInitScript(()=>{ if(!sessionStorage.getItem('x')){ sessionStorage.setItem('x',1); localStorage.clear(); localStorage.setItem('instatoon.key','TEST'); localStorage.setItem('instatoon.helpSeen','1'); }});
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname,'../../site/instatoon.html')).href); await p.waitForTimeout(800);
  await p.click('[data-act="demo"]'); await p.waitForTimeout(300);
  // make demo plan link so status updates
  await p.evaluate(()=>{ S.planRef={ym:S.month.ym,k:0,title:S.month.items[0].title}; save(); });
  await p.click('.actions [data-step="post"]'); await p.waitForTimeout(500);
  console.log('letterBox',!!await p.$('#letterBox'),'twt',!!await p.$('[data-twt]'),'jump',await p.$$eval('[data-jump]',e=>e.map(x=>x.innerText)));
  console.log('sections',await p.$$eval('#main h2.sec',e=>e.map(x=>x.innerText)));
  console.log('guide last',await p.$eval('#guideBox .guide li:last-child .gh b',e=>e.innerText));
  console.log('endPrompt:\n'+await p.evaluate(()=>endPrompt()));
  await p.evaluate(()=>{ const d='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'; setRef(0,d); setRef(1,d); vPost(); });
  await p.click('[data-act="autoEmpty"]'); await p.waitForTimeout(4500);
  console.log('img calls',imgPrompts.length,'end drawn',await p.evaluate(()=>!!ec().img),'last prompt is end',imgPrompts.at(-1).includes('마지막 장(가게 안내 카드)'),'no cut prompt in end',!imgPrompts.at(-1).includes('2컷 / 총'));
  console.log('guide last tag',await p.$eval('#guideBox .guide li:last-child .tag',e=>e.innerText));
  await p.click('[data-jump="#reuse"]'); await p.waitForTimeout(600); await p.screenshot({path:'/tmp/claude-0/w1.png'});
  await p.evaluate(()=>{ S.toon.pre={spell:1,fact:1,ad:1,consent:1,copy:1,look:1}; save(); });
  await p.click('[data-act="zip"]'); await p.waitForTimeout(1500);
  console.log('history',await p.evaluate(()=>S.history.map(h=>h.title+'|'+h.type+'|'+h.thumb.length)),'plan0',await p.evaluate(()=>stOf(S.month.items[0])));
  console.log('todo',await p.$eval('#todo',e=>e.innerText.replace(/\n/g,' ')));
  console.log('kit has posted?',!!await p.$('[data-act="posted"]'),'feed?',!!await p.$('.feed'),'checks?',!!await p.$('[data-kitck]'));
  await p.click('[data-jump="#kit"]'); await p.waitForTimeout(600); await p.screenshot({path:'/tmp/claude-0/w2.png'});
  await p.click('[data-mode2="stats"]'); await p.waitForTimeout(300); console.log('stats rows',await p.$$eval('.srow',e=>e.length));
  await p.click('[data-mode2="month"]'); await p.waitForTimeout(300); console.log('month sum',await p.$eval('.plan-sum',e=>e.innerText.replace(/\n/g,' ')));
  await p.setViewportSize({width:390,height:844}); await p.click('[data-mode2="one"]'); await p.waitForTimeout(300);
  console.log('hscroll',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await p.evaluate(()=>scrollTo(0,0)); await p.screenshot({path:'/tmp/claude-0/w3.png'});
  console.log('errors',errs); await b.close();
})();
