const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.stack||e.message)); p.on('console',m=>errs.push('console:'+m.text()));
await p.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,body:''}));
await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname,'../../site/instatoon.html')).href); await p.waitForTimeout(800); console.log(errs.join('\n').slice(0,2000)); await b.close(); })();
