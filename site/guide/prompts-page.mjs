// 인스타툰 프롬프트 페이지(/prompts/) — 시안. 빈칸만 채우면 GPT·제미나이·젠스파크에 붙여 넣을 프롬프트가 완성된다.
// 그림 규칙·글자 규칙·다시 요청 문장은 site/index.html(인스타툰 연재실 3단계)에 있는 실제 문장을 옮겼다(귀여운 2~3등신 테마 기준).
// 입력값은 이 브라우저의 localStorage에만 저장하고, 어디로도 보내지 않는다(AI 호출 없음).
import { ORIGIN, SITE, head, header, footer, esc } from './lib.mjs';

const ART = '한국 인스타툰 치비 그림체. 머리가 크고 몸이 작은 2~3등신, 굵고 깔끔한 검은 외곽선, 부드러운 단색 채색, 볼터치, 과장되고 귀여운 표정.';
const LETTER = `[글자 규칙 - 한국 웹툰 식자 방식 · 모든 컷 똑같이]
■ 제목(컷 위 타이틀): 위쪽 가운데, 굵고 둥근 검은 고딕 제목체에 두꺼운 흰 외곽선. 한 줄 7~10자로 끊어 두 줄. 강조 단어 아래 부드러운 노란 형광펜. 인물 얼굴은 가리지 않는다.
■ 말풍선(대사): 흰 둥근 말풍선, 검은 테두리, 검은 둥근 고딕체. 글자 둘레 여백을 넉넉히, 두 줄 이상이면 가운데 정렬. 꼬리는 짧고 뾰족하게 말하는 사람 입 쪽으로.
■ 말풍선 종류: 속마음은 뭉게구름 모양(꼬리 대신 작은 동그라미), 외침은 뾰족한 폭발형, 속삭임은 점선 테두리, 떨림·당황은 물결 테두리.
■ 효과음: 빨간 굵은 글씨, 흰 외곽선, 살짝 기울임. 소리가 나는 곳 바로 옆에 그림의 일부로.
■ 손글씨 의성어·작은 혼잣말: 작은따옴표(' ')로 감싼 말만, 풍선 없이 인물 머리 옆에 작은 손글씨로.
■ 시간·장소 자막: 흰 네모 칸에 검은 테두리, 검은 고딕체, 컷 왼쪽 모서리. 모든 컷 같은 모양.
■ 감정 기호(땀방울, 반짝이, 분노 마크, 물음표)는 글자가 아니라 그림 기호로.
■ 휴대폰·메뉴판·간판 속: 제가 준 문구가 없으면 글자 없이 단순한 선과 아이콘으로만. 브랜드 이름, 로고, 메뉴 이름을 지어내지 마세요.
■ 인물 옆이나 옷에 이름, 나이, 역할 같은 설명 라벨은 절대 글자로 쓰지 마세요. 명찰은 비워 두세요.
■ 정확도: 글자는 대본의 따옴표 안 문구만, 한 글자도 바꾸지 말고 맞춤법 그대로. 그 밖의 글자와 영어는 넣지 마세요.
■ 통일: 글씨체, 글자 크기, 외곽선 두께, 말풍선 모양은 1컷부터 마지막 컷까지 똑같이.`;
const FIXES = [
  ['얼굴·옷이 바뀌었을 때', '캐릭터가 달라졌어요. 처음 첨부한 이미지와 얼굴, 머리 모양, 옷이 똑같도록 이 컷을 다시 그려 주세요. 장면과 구도는 그대로예요.'],
  ['글자가 틀렸을 때', '글자가 틀리게 들어갔어요. 이번 컷에 드린 문구를 따옴표 안 글자 그대로, 한 글자도 바꾸지 말고 다시 넣어 주세요. 그림은 그대로 유지해 주세요.'],
  ['지어낸 글자·이름표가 생겼을 때', '그림에 제가 드리지 않은 글자가 들어갔어요. 인물 옆 이름·나이·역할 글자, 영어, 간판·메뉴판·화면 속 지어낸 글자를 모두 지우고, 제가 따옴표로 드린 문구만 남긴 같은 장면으로 다시 그려 주세요.'],
  ['글자 모양이 1컷과 다를 때', '글자 모양이 1컷과 달라요. 1컷과 같은 글씨체, 같은 크기, 같은 위치, 같은 외곽선으로 이 컷의 글자를 다시 넣어 주세요.'],
  ['비율이 바뀌었을 때', '비율이 앞 컷과 달라요. 그림 내용은 그대로 두고 {ratio}로 다시 그려 주세요.'],
  ['그림 대신 설명만 줄 때', '설명 말고 이미지로 그려 주세요. 방금 드린 장면을 {ratio} 그림 한 장으로 만들어 주세요.'],
];

const CSS = `
.pw{max-width:860px;margin:0 auto;padding:0 16px 48px}
.pw h1{font-size:clamp(26px,6vw,40px);line-height:1.25;margin:28px 0 10px;letter-spacing:-.02em}
.pw .sub{color:var(--ink-2);margin:0 0 6px;font-size:17px}
.pw .badges{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 22px}
.pw .badges span{background:var(--sunken);border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:14px}
.pw .flow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 24px;padding:0;list-style:none;counter-reset:f}
.pw .flow li{background:var(--sunken);border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.45}
.pw .flow b{display:block;font-size:15px}
@media (max-width:640px){.pw .flow{grid-template-columns:1fr 1fr}}
.pw .card{border:1px solid var(--line);border-radius:18px;padding:18px;margin:0 0 18px;background:var(--surface)}
.pw .card h2{display:flex;align-items:center;gap:10px;font-size:21px;margin:0 0 4px}
.pw .num{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:16px;flex:none}
.pw .card > p.d{color:var(--ink-2);margin:0 0 14px;font-size:15px}
.pw details.shop{border:2px solid var(--ink);border-radius:18px;padding:14px 18px;margin:0 0 18px}
.pw details.shop summary{cursor:pointer;font-weight:700;font-size:18px}
.pw .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;margin-top:12px}
@media (max-width:640px){.pw .grid{grid-template-columns:1fr}}
.pw label{display:block;font-size:14px;font-weight:700;margin:0 0 4px}
.pw label small{font-weight:400;color:var(--muted)}
.pw input,.pw select,.pw textarea{width:100%;box-sizing:border-box;border:1px solid var(--line-2);border-radius:10px;padding:10px 12px;font:inherit;font-size:16px;background:var(--bg);color:var(--ink)}
.pw textarea{min-height:76px;resize:vertical}
.pw .wide{grid-column:1/-1}
.pw .step{margin:14px 0 0}
.pw .step > b{display:block;font-size:15px;margin:0 0 6px}
.pw pre{white-space:pre-wrap;word-break:keep-all;overflow-wrap:anywhere;background:var(--sunken);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:0;font:inherit;font-size:14px;line-height:1.65;max-height:260px;overflow:auto}
.pw .cp{margin:8px 0 0;display:inline-flex;align-items:center;gap:6px;border:0;border-radius:10px;padding:10px 16px;background:var(--ink);color:#fff;font:inherit;font-weight:700;font-size:15px;cursor:pointer;min-height:44px}
.pw .cp.done{background:var(--accent);color:var(--accent-ink)}
.pw .hint{font-size:14px;color:var(--ink-2);margin:8px 0 0;padding-left:18px}
.pw .hint li{margin:2px 0}
.pw .fixes{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:640px){.pw .fixes{grid-template-columns:1fr}}
.pw .fx{border:1px solid var(--line);border-radius:12px;padding:12px}
.pw .fx b{display:block;margin:0 0 4px}
.pw .fx p{margin:0;font-size:14px;color:var(--ink-2);line-height:1.6}
.pw .more{background:var(--sunken);border-radius:18px;padding:16px 18px;margin-top:22px}
.pw .more a{font-weight:700}
.pw .tabs{display:flex;gap:8px;margin:8px 0 0}
.pw .tab{flex:1;border:1px solid var(--line-2);background:var(--bg);color:var(--ink);border-radius:12px;padding:10px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;min-height:44px;line-height:1.3}
.pw .tab small{display:block;font-weight:400;font-size:13px;color:var(--muted)}
.pw .tab.on{border:2px solid var(--ink);background:var(--sunken)}
.pw .preview{background:var(--accent);color:var(--accent-ink);border-radius:12px;padding:10px 14px;font-size:14px;margin:16px 0 0}
`;

const JS = `(function(){
var KEY='prompt-page-v1', F=['name','type','cust','tone','who','looks','keep','ratio','cuts','memo','planN','story','script'];
var D={name:'',type:'',cust:'',tone:'친근한 존댓말',who:'',looks:'',keep:'',ratio:'3:4',cuts:'6',memo:'',planN:'4',story:'',script:''};
var R={'1:1':'1:1 정사각형 비율(1080×1080px)','4:5':'4:5 세로 비율(1080×1350px)','3:4':'3:4 세로 비율(1080×1440px)'};
var ART=${JSON.stringify(ART)}, LETTER=${JSON.stringify(LETTER)}, FIXES=${JSON.stringify(FIXES)};
var v={}; try{ v=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ v={}; }
F.forEach(function(k){ var el=document.getElementById('f-'+k); if(!el) return; el.value=(v[k]!=null?v[k]:D[k]); el.addEventListener('input',up); el.addEventListener('change',up); });
function g(k,ph){ var el=document.getElementById('f-'+k); var x=el?el.value.trim():''; return x||ph; }
function save(){ var o={}; F.forEach(function(k){ var el=document.getElementById('f-'+k); if(el) o[k]=el.value; }); try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} }
function shop(){ return '[가게] 이름: '+g('name','(가게 이름)')+' / 업종: '+g('type','(업종)')+' / 주 손님: '+g('cust','(주 손님)'); }
function who(){ return g('who','(주인공: 누구인지)')+', '+g('looks','(얼굴형, 머리 모양, 늘 입는 옷)'); }
function P(){ var r=R[g('ratio','3:4')]||R['3:4'], n=g('cuts','6'), keep=g('keep','');
 return {
 plan: '너는 동네 가게의 인스타그램을 도와주는 기획자야.\\n'+shop()+'\\n[이번 달 메모] '+g('memo','특별한 일정 없음')+'\\n\\n이번 달 인스타그램에 올릴 인스타툰 소재를 '+g('planN','4')+'개 제안해 줘.\\n- 소재는 가게에서 실제로 있을 법한 작은 일(손님 질문, 준비 과정, 실수, 단골, 이용 안내)에서 골라 줘.\\n- 메모에 적은 일정이 있으면 그 전에 올릴 소재를 꼭 넣어 줘.\\n- 소재마다: 올릴 날짜(주 1~2회 간격), 한 줄 줄거리, 읽은 사람이 가져갈 한 문장, 마지막 장에서 부탁할 행동 1가지.\\n- 가격·할인율·효과처럼 내가 알려 주지 않은 숫자나 사실은 지어내지 말고 \"(확인 필요)\"라고 적어 줘.\\n- 표로 정리해 줘. '+g('tone','친근한 존댓말')+'로.',
 sheet: '인스타툰 주인공 캐릭터 시트를 만들어 주세요.\\n주인공: '+who()+(keep?'\\n절대 바뀌면 안 되는 것: '+keep:'')+'\\n그림체: '+ART+'\\n흰 배경 한 장에 정면 전신, 옆모습, 웃는 얼굴, 놀란 얼굴 4가지를 나란히 그려 주세요.\\n글자, 숫자, 이름표, 나이·역할 같은 설명 라벨은 넣지 마세요.',
 script: '너는 한국 인스타툰 작가야. 아래 이야기로 인스타툰 '+n+'컷 대본을 써 줘.\\n'+shop()+'\\n[주인공] '+who()+'\\n[있었던 일] '+g('story','(가게에서 있었던 일을 한두 줄로)')+'\\n\\n규칙:\\n- 메시지는 하나. 1컷은 제목으로 읽을 이유를 주고, 마지막 컷은 행동 1가지만 부탁해.\\n- 컷마다: 구도, 장면(그림에서 눈에 보여야 할 상태로), 제목(있을 때만, 두 줄 이내), 대사(누가, 어떤 말풍선으로), 효과음, 시간·장소 자막.\\n- 대사는 한 말풍선에 두 줄 안쪽. \"전화받으며\" 같은 지시문은 대사 따옴표 안에 넣지 말고 장면에 써.\\n- 자막의 시간은 1컷부터 순서대로, 표기는 \"오후 3시\"처럼 한 가지로.\\n- 가격·날짜 같은 사실은 내가 준 것만 쓰고, 없으면 넣지 마.\\n- '+g('tone','친근한 존댓말')+'로.\\n- 그림은 아직 그리지 말고 대본 표만 보여 줘. 내가 고칠 수 있게.',
 draw: '좋아요, 이 대본대로 그림을 그릴 거예요. 첨부한 이미지가 주인공 캐릭터예요.\\n\\n[그림 규칙 - 모든 컷 똑같이]\\n1. 주인공의 얼굴, 머리 모양, 옷, 체형, 그림체를 첨부 이미지와 똑같이 유지해 주세요.'+(keep?' 특히 \"'+keep+'\"은(는) 모든 컷에서 꼭 지켜 주세요.':'')+'\\n2. 그림체: '+ART+'\\n3. 배경: '+g('type','가게')+' 공간. 배경은 연한 회색 톤으로 단순하게, 인물과 중요한 소품만 컬러로.\\n4. 모든 컷은 반드시 '+r+'. 컷마다 비율이 달라지면 안 돼요. 제목이 있는 컷은 윗부분 4분의 1을 제목 자리로 비워 두세요.\\n5. 그림 바깥에 검은 테두리 선은 넣지 말고 화면을 끝까지 채워 주세요.\\n\\n'+LETTER+'\\n\\n한 번에 한 컷씩만 그려 주세요. 지금 1컷을 그리고, 제가 \"다음\"이라고 하면 다음 컷을 그려 주세요.',
 batch: '[작업]\\n아래 내용으로 인스타툰 '+n+'장을 순서대로, 한 장씩 따로 만들어 주세요.\\n\\n[공통 설정]\\n- 비율: '+r+', '+n+'장 모두 똑같이. 제목이 있는 장은 윗부분 4분의 1을 제목 자리로 비워 두세요. 그림 바깥에 검은 테두리 선은 넣지 마세요.\\n- 그림체: '+ART+'\\n  선: 굵고 깔끔한 검은 외곽선, 굵기 일정 / 색: 부드러운 단색 채색, 볼에 분홍 볼터치 / 그림자: 거의 없이 은은한 단색 음영만\\n  쓰지 말 것: 사실적 비율, 가는 선, 순정만화풍 반짝이 눈, 3D 질감\\n- 배경: '+g('type','가게')+' 공간. 배경은 연한 회색 톤으로 단순하게, 인물과 중요한 소품만 컬러로.\\n- 등장인물: [주인공] '+who()+'\\n    첨부: 1번 (②에서 받은 캐릭터 그림)'+(keep?'\\n    절대 유지: '+keep:'')+'\\n- 글자: 아래 [장별 내용]에 따옴표로 적은 문구만, 한 글자도 바꾸지 말고 한글 그대로 정확히 넣어 주세요. 그 밖의 글자·영어·이름표는 넣지 마세요.\\n  · 제목: 위쪽 가운데, 굵고 둥근 검은 고딕 제목체에 두꺼운 흰 외곽선. 강조 단어 아래 부드러운 노란 형광펜.\\n  · 말풍선: 흰 둥근 말풍선, 검은 테두리, 검은 둥근 고딕체. 꼬리는 말하는 사람 입 쪽으로 짧게(속마음은 뭉게구름, 외침은 뾰족한 폭발형, 속삭임은 점선, 떨림은 물결 테두리).\\n  · 효과음: 빨간 굵은 글씨, 흰 외곽선, 살짝 기울임. 소리 나는 곳 옆에 그림의 일부로.\\n  · 자막: 흰 네모 칸에 검은 테두리, 검은 고딕체, 컷 왼쪽 모서리.\\n  · 글씨체·글자 크기·말풍선 모양은 '+n+'장 모두 똑같이.\\n\\n[장별 내용]\\n'+g('script','(여기에 3-1에서 받은 대본을 붙여 넣으세요. 장마다 장면, 제목, 대사, 효과음, 자막)')+'\\n\\n[마무리]\\n- 모든 장에서 인물의 얼굴·머리 모양·옷·체형을 첨부 이미지와 똑같이 유지하세요.\\n- 첨부 이미지는 얼굴·머리·옷·체형을 참고하는 용도예요. 그림체는 [공통 설정]을 우선하세요.\\n- '+n+'장 모두 같은 그림체와 같은 비율로 그려 주세요.\\n- 같은 대사·효과음을 한 장 안에서 두 번 쓰지 마세요.\\n- 대본에 괄호로 적힌 지시문은 그림으로만 표현하고 글자로 쓰지 마세요.',
 caption: '위 인스타툰을 인스타그램에 올릴 거예요. 캡션과 해시태그를 써 주세요.\\n- 첫 두 줄에 읽을 이유를 주고, 대본의 이야기와 맞게.\\n- 손님에게 도움이 되는 정보 1~2줄, 마지막에 부탁 1가지.\\n- '+g('tone','친근한 존댓말')+'로, 이모지는 2개 이하.\\n- 해시태그는 업종·지역·주제를 섞어 8개 안쪽, 내용과 상관없는 인기 태그는 빼고.\\n- 가게: '+g('name','(가게 이름)')+', '+g('type','(업종)')+'. 내가 알려 주지 않은 가격·효과나 \"최고\" 같은 표현은 쓰지 마세요.',
 fixes: FIXES.map(function(f){ return f[1].replace('{ratio}',r); })
 }; }
function up(){ save(); var p=P(); ['plan','sheet','script','draw','batch','caption'].forEach(function(k){ var el=document.getElementById('p-'+k); if(el) el.textContent=p[k]; }); p.fixes.forEach(function(t,i){ var el=document.getElementById('p-fix'+i); if(el) el.textContent=t; }); }
function copy(t,b){ function ok(){ b.classList.add('done'); var o=b.getAttribute('data-l'); b.textContent='복사했어요'; setTimeout(function(){ b.classList.remove('done'); b.textContent=o; },1600); }
 if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(ok,function(){ fb(t); ok(); }); } else { fb(t); ok(); } }
function fb(t){ var ta=document.createElement('textarea'); ta.value=t; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); }
document.addEventListener('click',function(e){ var t=e.target.closest('[data-tab]'); if(t){ var k=t.getAttribute('data-tab'); document.querySelectorAll('[data-tab]').forEach(function(x){ var on=x===t; x.classList.toggle('on',on); x.setAttribute('aria-selected',on?'true':'false'); }); document.querySelectorAll('[data-pane]').forEach(function(p){ p.hidden=p.getAttribute('data-pane')!==k; }); return; } var b=e.target.closest('[data-cp]'); if(!b) return; var el=document.getElementById(b.getAttribute('data-cp')); if(el) copy(el.textContent,b); });
up();
})();`;

const btn = (id, label = '복사하기') => `<button type="button" class="cp" data-cp="${id}" data-l="${esc(label)}">${esc(label)}</button>`;
const field = (k, label, ph, opt = {}) => `<div class="${opt.wide ? 'wide' : ''}"><label for="f-${k}">${label}</label>${opt.area ? `<textarea id="f-${k}" placeholder="${esc(ph)}"></textarea>` : opt.sel ? `<select id="f-${k}">${opt.sel.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>` : `<input id="f-${k}" placeholder="${esc(ph)}" autocomplete="off">`}</div>`;

export function buildPromptsPage() {
  const u = `${ORIGIN}/prompts/`;
  const title = `인스타툰 프롬프트: GPT·제미나이에 붙여 넣는 기획·캐릭터·그림 문장 | ${SITE}`;
  const desc = '빈칸만 채우면 ChatGPT, 제미나이, 젠스파크에 그대로 붙여 넣을 인스타툰 프롬프트가 완성돼요. 한 달 기획, 주인공 캐릭터 고정, 대본과 그림, 올릴 글, 결과가 이상할 때 다시 요청하는 문장까지.';
  return head({ title, desc, canonical: u, type: 'website', body: ' data-page-type="prompts"', extra: `<style>${CSS}</style>` })
    .replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex">')
    + header('prompts') + `
<main id="main" class="pw">
<p class="preview">시안 미리보기예요. 아직 메뉴와 검색에는 연결하지 않았어요.</p>
<h1>GPT·제미나이에 그대로 붙여 넣는<br>인스타툰 프롬프트</h1>
<p class="sub">우리 가게 정보만 한 번 적으면, 기획부터 캐릭터 고정, 그림, 올릴 글까지 복사해서 쓰는 문장이 완성돼요.</p>
<div class="badges"><span>로그인 없음</span><span>키 필요 없음</span><span>횟수 제한 없음</span><span>ChatGPT · 제미나이 · 젠스파크</span></div>
<ol class="flow">
<li><b>① 기획</b>이번 달 뭐 올리지?</li>
<li><b>② 캐릭터</b>매번 같은 얼굴로</li>
<li><b>③ 인스타툰</b>대본 → 그림(한 컷씩·한 번에)</li>
<li><b>④ 올릴 글</b>캡션·해시태그</li>
</ol>

<details class="shop" open>
<summary>우리 가게 정보 (한 번만 적으면 아래 빈칸이 다 채워져요)</summary>
<div class="grid">
${field('name', '가게 이름', '예: 푸짐 반찬가게')}
${field('type', '업종', '예: 반찬가게')}
${field('cust', '주 손님', '예: 퇴근길 직장인, 근처 주민')}
${field('tone', '말투', '', { sel: [['친근한 존댓말', '친근한 존댓말'], ['정중한 존댓말', '정중한 존댓말'], ['편한 반말', '편한 반말']] })}
${field('who', '주인공', '예: 50대 여성 반찬가게 사장님')}
${field('keep', '절대 바뀌면 안 되는 것 <small>(하나만)</small>', '예: 표범무늬 스카프')}
${field('looks', '주인공 생김새 <small>(그림으로 보이는 특징만, 실존 인물 이름 X)</small>', '예: 동글동글한 얼굴, 곱슬 파마머리를 묶음, 검은 앞치마, 금색 귀걸이', { wide: true })}
${field('ratio', '그림 비율', '', { sel: [['3:4', '3:4 세로 (추천)'], ['4:5', '4:5 세로'], ['1:1', '1:1 정사각형']] })}
${field('cuts', '컷 수', '', { sel: [['4', '4컷'], ['6', '6컷'], ['8', '8컷']] })}
</div>
<p class="hint" style="list-style:none;padding:0">적은 내용은 이 브라우저에만 저장돼요. 어디로도 보내지 않아요.</p>
</details>

<section class="card">
<h2><span class="num">1</span>기획: 이번 달 뭐 올리지?</h2>
<p class="d">이번 달 일정만 적고 복사해서 GPT에 붙여 넣으면, 소재와 날짜별 연재표를 짜 줘요.</p>
<div class="grid">
${field('memo', '이번 달 메모 <small>(신메뉴, 휴무, 이벤트 등)</small>', '예: 15일 제육볶음 출시, 25일 휴무', { wide: true, area: true })}
${field('planN', '소재 개수', '', { sel: [['4', '4개 (주 1회)'], ['8', '8개 (주 2회)']] })}
</div>
<div class="step"><b>GPT에 붙여 넣을 문장</b><pre id="p-plan"></pre>${btn('p-plan')}</div>
</section>

<section class="card">
<h2><span class="num">2</span>캐릭터 고정: 우리 가게 주인공, 매번 같은 얼굴로</h2>
<p class="d">먼저 주인공 기준 그림을 한 장 받아요. 이 그림을 앞으로 모든 컷에 첨부하는 게 핵심이에요.</p>
<div class="step"><b>그림 AI에 붙여 넣을 문장</b><pre id="p-sheet"></pre>${btn('p-sheet')}</div>
<ul class="hint"><li>마음에 들 때까지 다시 받고, 고른 그림은 휴대폰이나 컴퓨터에 저장해 두세요.</li><li>"절대 바뀌면 안 되는 것"을 하나 적으면 잘 지켜져요. <a href="/guide/burger-store-instatoon-case/">수제버거 사례</a>에서는 검은 위생장갑이 6장 내내 유지됐어요.</li><li>실존 인물 이름("○○ 닮게")은 쓰지 마세요.</li></ul>
</section>

<section class="card">
<h2><span class="num">3</span>인스타툰: 대본 받고, 한 컷씩 그리기</h2>
<p class="d">대본을 먼저 받아 고치고, 그다음 그림을 받아요. 대본 단계에서 고치면 그림을 다시 뽑는 일이 확 줄어요.</p>
<div class="grid">${field('story', '있었던 일 <small>(한두 줄)</small>', '예: 브레이크타임에 손님이 문을 흔들고 전화까지 했다', { wide: true, area: true })}</div>
<div class="step"><b>3-1. 대본 요청</b><pre id="p-script"></pre>${btn('p-script')}</div>
<ul class="hint"><li>나온 대본에서 자막의 시간 순서, 숫자, 괄호만 따로 읽어 보세요. <a href="/guide/banchan-store-instatoon-case/">반찬가게 사례</a>에서 실제로 걸린 곳이에요.</li></ul>
<p class="d" style="margin:16px 0 0"><b>3-2. 그림 받기</b> · 쓰는 도구에 맞게 하나만 고르세요.</p>
<div class="tabs" role="tablist"><button type="button" role="tab" class="tab on" data-tab="one" aria-selected="true">한 컷씩<small>ChatGPT · 제미나이</small></button><button type="button" role="tab" class="tab" data-tab="all" aria-selected="false">한 번에 여러 컷<small>젠스파크</small></button></div>
<div class="tp" data-pane="one"><div class="step"><b>②에서 받은 캐릭터 그림을 첨부하고, 대본을 받은 같은 대화창에 붙여 넣기</b><pre id="p-draw"></pre>${btn('p-draw')}</div>
<ul class="hint"><li>1컷이 나오면 "다음"이라고만 보내면 다음 컷을 그려요. 컷마다 바로 확인하고 고칠 수 있어요.</li></ul></div>
<div class="tp" data-pane="all" hidden><div class="grid">${field('script', '3-1에서 받은 대본 붙여 넣기', '예: 1장 - 장면: …, 제목: "…", 대사: "…", 자막: "…"', { wide: true, area: true })}</div>
<div class="step"><b>젠스파크 이미지 만들기에 캐릭터 그림을 1번으로 첨부하고 붙여 넣기</b><pre id="p-batch"></pre>${btn('p-batch')}</div>
<ul class="hint"><li>한 번 붙여 넣으면 여러 장을 한꺼번에 받아요. <a href="/guide/burger-store-instatoon-case/">수제버거 사례</a> 6장이 이 방식이에요.</li><li>마음에 안 드는 장은 "3장만 다시 그려 주세요"처럼 따로 요청하세요.</li><li>대본에 괄호 지시문이 있으면 그림에 글자로 들어갈 수 있어요. 붙여 넣기 전에 대사 속 괄호를 지워 주세요.</li></ul></div>
</section>

<section class="card">
<h2><span class="num">4</span>올릴 글: 캡션과 해시태그</h2>
<p class="d">그림을 다 받은 같은 대화창에 붙여 넣으세요.</p>
<div class="step"><pre id="p-caption"></pre>${btn('p-caption')}</div>
</section>

<section class="card">
<h2><span class="num">!</span>결과가 이상할 때 다시 요청하는 문장</h2>
<p class="d">이상한 컷이 나온 바로 그 자리에서 붙여 넣으세요.</p>
<div class="fixes">${FIXES.map(([t], i) => `<div class="fx"><b>${esc(t)}</b><p id="p-fix${i}"></p>${btn(`p-fix${i}`, '복사')}</div>`).join('')}</div>
</section>

<div class="more">
<p style="margin:0 0 6px"><b>이 프롬프트로 만든 실제 결과</b>: <a href="/guide/convenience-store-instatoon-case/">편의점 알바생</a> · <a href="/guide/banchan-store-instatoon-case/">반찬가게 사장님</a> · <a href="/guide/burger-store-instatoon-case/">수제버거 사장님</a></p>
<p style="margin:0">컷별로 꼼꼼하게 고치고 싶다면 <a href="/">자세하게 만들기(기존 인스타툰 연재실)</a>를 쓰세요.</p>
</div>
</main>
` + footer + `\n<script>${JS}</script>\n</body>\n</html>\n`;
}
