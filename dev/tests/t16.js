const { chromium } = require('playwright');
const zlib=require('zlib'), fs=require('fs');
function png(w,h,r,g,bb){const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){raw[y*(w*3+1)]=0;for(let x=0;x<w;x++){const o=y*(w*3+1)+1+x*3;raw[o]=r;raw[o+1]=(g+y)%255;raw[o+2]=bb;}}const crc=(b)=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0};const ch=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))])}
for(let k=1;k<=4;k++) fs.writeFileSync(`/tmp/claude-0/pic${k}.png`,png(600,750,k*50,k*30,200-k*40));
const IMG=png(700,700,160,160,160).toString('base64');
let prompts=[];
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1300,height:1000},acceptDownloads:true}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,body:''}));
  await p.route('**generativelanguage.googleapis.com/**',async r=>{
    const body=JSON.parse(r.request().postData()); const t=body.contents[0].parts[0].text||'';
    if(body.generationConfig.responseModalities) return r.fulfill({json:{candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:IMG}}]}}]}});
    prompts.push(t);
    const out=t.includes('릴스 영상으로도')?{caption:'빵집이 텅 비었다 😳\n범인은?\n전체 이야기는 프로필 게시물에서',hashtags:'#망원동 #빵집 #인스타툰',comment:'다음 편 예고!'}:t.includes('맞춤법')?{fixes:[{cut:2,field:'bubble',before:'아까까지',after:'아까까지는',reason:'t'}]}:{};
    r.fulfill({json:{candidates:[{content:{parts:[{text:JSON.stringify(out)}]}}]}});
  });
  await p.addInitScript(()=>{ if(!sessionStorage.getItem('x')){ sessionStorage.setItem('x',1); localStorage.clear(); localStorage.setItem('instatoon.key','TEST'); localStorage.setItem('instatoon.helpSeen','1'); }});
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname,'../../site/instatoon.html')).href); await p.waitForTimeout(800);
  console.log('modes',await p.$$eval('#modes .mode b',e=>e.map(x=>x.innerText)));
  await p.click('[data-act="demo"]'); await p.waitForTimeout(300);
  // edit step: pre box + spell
  console.log('edit prelist',await p.$eval('#prelist',e=>e.innerText.replace(/\n/g,' | ')));
  await p.click('[data-act="spell"]'); await p.waitForTimeout(600); await p.click('[data-spfix="0"]'); await p.waitForTimeout(200);
  console.log('spell applied',await p.evaluate(()=>cuts()[1].bubble.split('\n')[0]), await p.$eval('#c1-bb',e=>e.value.split('\n')[0]));
  console.log('todo edit',await p.$eval('#todo',e=>e.innerText.replace(/\n/g,' ')), await p.$$eval('#todo .prog i',e=>e.length));
  await p.click('.actions [data-step="post"]'); await p.waitForTimeout(400);
  console.log('sections',await p.$$eval('#main h2.sec',e=>e.map(x=>x.innerText)),'jump',await p.$$eval('.jump .chip',e=>e.map(x=>x.innerText)));
  console.log('endli fields',!!await p.$('#e-head'),'endPre',!!await p.$('#endPre'),'endbox',!!await p.$('#endbox'),'pre',!!await p.$('.pre'));
  await p.fill('#e-btn','네이버 예약하기'); console.log('pre updated',await p.$eval('#endPre',e=>e.textContent.includes('네이버 예약하기')));
  console.log('todo post',await p.$eval('#todo',e=>e.innerText.replace(/\n/g,' ')));
  // upload 3 pics
  await p.click('[data-act="upall"]'); await p.setInputFiles('#fileIn',['/tmp/claude-0/pic3.png','/tmp/claude-0/pic1.png','/tmp/claude-0/pic2.png']); await p.waitForTimeout(800);
  console.log('pics',await p.evaluate(()=>pics().length),'thumbs',await p.$$eval('.pth',e=>e.length),'phone dots',await p.$$eval('#phone .dots i',e=>e.length));
  await p.click('[data-pmove="0|1"][data-list="toon"]'); await p.waitForTimeout(300);
  await p.click('[data-pdel="2"][data-list="toon"]'); await p.waitForTimeout(300); console.log('after del',await p.evaluate(()=>pics().length));
  console.log('todo post2',await p.$eval('#todo',e=>e.innerText.replace(/\n/g,' ')));
  await p.$eval('#sec-save',e=>e.scrollIntoView()); await p.screenshot({path:'/tmp/claude-0/x1.png'});
  // auto continue: draws remaining (6 cuts +1 end = 7 total) from index 2
  await p.evaluate(()=>{ const d='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'; setRef(0,d); setRef(1,d); vPost(); });
  await p.click('[data-act="autoEmpty"]'); await p.waitForTimeout(4500); console.log('after auto pics',await p.evaluate(()=>pics().length));
  // go reels
  await p.click('.jump [data-mode2="reels"]'); await p.waitForTimeout(800);
  console.log('reels src',await p.evaluate(()=>[ru().src,mediaList().length]),'todo',await p.$eval('#todo',e=>e.innerText.replace(/\n/g,' ')));
  console.log('reel text prefilled',await p.$eval('#rt-cap',e=>e.value.slice(0,20)));
  await p.screenshot({path:'/tmp/claude-0/x2.png',fullPage:true});
  // own upload
  await p.click('[data-rsrc="own"]'); await p.waitForTimeout(200);
  await p.click('[data-act="rup"]'); await p.setInputFiles('#fileIn',['/tmp/claude-0/pic1.png','/tmp/claude-0/pic2.png','/tmp/claude-0/pic4.png']); await p.waitForTimeout(800);
  console.log('own',await p.evaluate(()=>[ru().own.length,mediaList().length]));
  await p.click('[data-rsec="2"]'); await p.click('[data-act="reelMake"]'); await p.waitForFunction(()=>!reelBusy,null,{timeout:60000});
  console.log('reel',await p.$eval('#st-reel',e=>e.innerText));
  await p.click('[data-act="reelText"]'); await p.waitForTimeout(600); console.log('reel text',await p.$eval('#rt-cap',e=>e.value.split('\n')[0]));
  console.log('reelPostText',JSON.stringify(await p.evaluate(()=>reelPostText())));
  console.log('todo reels',await p.$eval('#todo',e=>e.innerText.replace(/\n/g,' ')));
  // back to one, zip
  await p.click('#modes [data-mode2="one"]'); await p.waitForTimeout(300);
  await p.click('[data-act="zip"]'); await p.waitForTimeout(1500);
  console.log('zip status',await p.$eval('#st-zip',e=>e.innerText),'history',await p.evaluate(()=>S.history.length));
  await p.setViewportSize({width:390,height:844}); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(200); await p.screenshot({path:'/tmp/claude-0/x3.png'});
  console.log('hscroll',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await p.click('#modes [data-mode2="reels"]'); await p.waitForTimeout(500); console.log('hscroll reels',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  console.log('errors',errs); await b.close();
})();
