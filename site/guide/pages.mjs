// 소개 / 개인정보처리방침 / 이용안내 페이지. 사이트의 실제 동작(HANDOFF.md, site/index.html)에 맞춰 작성한다.
// 운영자 정보·문의 이메일은 site/site-info.json 에 있을 때만 표시한다(없으면 지어내지 않는다).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGIN, SITE, cfg, head, header, footer, ld, esc, inline, trackJs, bodyAttr } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const info = (() => { try { return JSON.parse(fs.readFileSync(path.join(here, '..', 'site-info.json'), 'utf8')); } catch { return {}; } })();
export const siteInfo = { operatorName: String(info.operatorName || '').trim(), contactEmail: String(info.contactEmail || '').trim(), adsensePublisherId: String(info.adsensePublisherId || '').trim() };
if (siteInfo.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteInfo.contactEmail)) throw new Error('site-info.json contactEmail 형식 오류');
if (siteInfo.adsensePublisherId && !/^pub-\d{10,20}$/.test(siteInfo.adsensePublisherId)) throw new Error('site-info.json adsensePublisherId는 pub-숫자 형식');

const P = (t) => `<p>${inline(t)}</p>`;
const UL = (...a) => `<ul>${a.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
const S = (id, h, ...body) => `<section><h2 id="${id}">${esc(h)}</h2>${body.join('')}</section>`;
const TBL = (head_, ...rows) => `<div class="tbl"><table><thead><tr>${head_.map((x) => `<th scope="col">${inline(x)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const UPDATED = '2026-10-01';

const contactBlock = siteInfo.contactEmail
  ? `<p>문의: <a href="mailto:${esc(siteInfo.contactEmail)}">${esc(siteInfo.contactEmail)}</a></p>`
  : P('문의 수단은 운영자가 확정되는 대로 이 페이지에 게시합니다. 아직 게시되지 않았으므로 현재는 이 사이트를 통한 문의 접수 경로가 없습니다.');
const operatorLine = siteInfo.operatorName ? P(`운영: ${siteInfo.operatorName}`) : '';

function page({ slug, title, metaTitle, desc, h1, lead, sections }) {
  const u = `${ORIGIN}/${slug}/`;
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: h1, item: u }] };
  const webpage = { '@context': 'https://schema.org', '@type': 'WebPage', name: h1, url: u, description: desc, inLanguage: 'ko', dateModified: UPDATED };
  return head({ title: `${metaTitle} | ${SITE}`, desc, canonical: u, type: 'website', body: bodyAttr('info', slug), ga: { content_group: '사이트 안내' }, extra: ld(webpage) + ld(crumbs) })
    + header('') + `
<main id="main" class="wrap">
<nav class="crumb" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li aria-current="page">${esc(h1)}</li></ol></nav>
<article class="article">
<h1>${esc(h1)}</h1>
<p class="lead">${inline(lead)}</p>
<p class="meta">최종 업데이트 <time datetime="${UPDATED}">${UPDATED}</time></p>
${sections.join('\n')}
</article>
</main>
` + footer + `\n${trackJs}\n</body>\n</html>\n`;
}

const gaParagraph = () => cfg.ga
  ? S('analytics', '방문 통계(Google Analytics)', P('이 사이트는 방문 통계를 위해 Google Analytics 4를 사용합니다. 페이지 조회, 활성 사용자, 참여 시간, 가이드 글의 스크롤 깊이와 링크 클릭 같은 이용 정보를 쿠키 등을 통해 수집하며, 이 정보는 Google로 전송됩니다. 이 통계에는 사용자가 인스타툰 제작 화면에 입력한 내용, 사진, API 키가 포함되지 않습니다. 브라우저 설정에서 쿠키를 차단하거나 Google이 제공하는 차단 도구로 수집을 거부할 수 있습니다.'))
  : S('analytics', '방문 통계', P(`현재(${UPDATED} 기준) 이 사이트에는 방문 통계 도구가 활성화되어 있지 않습니다. 도입하는 경우 이 방침에 사용 목적과 수집 항목을 먼저 반영합니다.`));

export const pages = [
  { slug: 'about', title: '소개', build: () => page({
    slug: 'about', h1: '인스타툰 연재실 소개', metaTitle: '인스타툰 연재실 소개: 가게 이야기를 인스타툰으로',
    desc: '인스타툰 연재실이 누구를 위해 무엇을 하는 도구인지, 가이드 글을 어떻게 만들고 관리하는지, 이용 전에 알아둘 한계를 소개합니다.',
    lead: '인스타툰 연재실은 동네 매장의 사장님, 직원, 홍보 담당자가 가게 이야기를 4~10컷 인스타툰으로 만들 수 있도록 돕는 웹 도구와 가이드를 제공하는 사이트입니다.',
    sections: [
      S('what', '무엇을 하는 도구인가', P('업종 하나만 고르면 가게에서 있었던 일을 바탕으로 대본, 컷 구성, 게시물 캡션, 해시태그, 릴스용 글의 초안을 만들어 줍니다. 한 달 연재표 기획, 완성 그림을 세로 영상과 스토리 이미지로 만드는 기능, 편마다 반응을 기록하는 기능, 댓글 답글 초안 도우미도 있습니다.'),
        P('이 도구는 **그림을 대신 그려 주지 않습니다.** 컷별 그림 프롬프트를 정리해 주면 사용자가 ChatGPT 같은 외부 이미지 도구에서 그림을 만들고, 완성 그림은 다시 이 도구에 올려 저장합니다. 사용 순서는 [[how-to-use-instatoon-room|사용법 글]]에서 설명합니다.')),
      S('who', '누구를 위한 것인가', P('디자인이나 마케팅을 전문으로 하지 않는 가게 운영자를 기준으로 만들었습니다. 카페, 음식점, 미용실, 사진관, 학원 등 업종을 가리지 않습니다.')),
      S('editorial', '가이드 글은 어떻게 만들고 관리하나', P('콘텐츠 가이드는 인스타툰 제작과 매장 SNS 운영에 대한 일반적인 설명입니다. 글은 AI 도구의 도움을 받아 작성한 초안을 바탕으로 하며, 다음 원칙으로 관리합니다.'),
        UL('근거를 확인하지 못한 통계, 검색량, 매출·방문 증가율은 쓰지 않습니다.', '예시로 든 가게와 사례는 글에서 "가상"이라고 표시합니다. 실제 고객 사례나 후기를 지어내지 않습니다.', 'Instagram, Facebook, Meta Business Suite 같은 외부 서비스의 기능은 자주 바뀌므로 단정하지 않고 공식 도움말 확인을 안내합니다.', '법률·광고·저작권 관련 내용은 일반적인 정보이며 법률 자문이 아닙니다.', '글을 고치면 최종 업데이트 날짜를 바꿉니다.'),
        P('잘못된 내용이나 오래된 내용을 발견하면 아래 문의 수단으로 알려 주세요. 문의 수단이 아직 게시되지 않은 동안에는 접수가 어렵습니다.')),
      S('limits', '이용 전에 알아둘 한계', UL('AI가 만든 대본과 문구는 초안입니다. 가격, 시간, 상호명, 효능·과장 표현은 사용자가 직접 확인해야 합니다.', '그림의 품질과 캐릭터 일관성은 사용자가 쓰는 외부 이미지 도구에 따라 달라집니다.', '작업 내용은 사용자의 브라우저에 저장되므로 브라우저 데이터를 지우면 사라질 수 있습니다. 백업 저장 기능을 사용하세요.', '이 도구로 만든 콘텐츠가 매출이나 팔로워 증가를 가져온다고 보장하지 않습니다.')),
      S('contact', '운영자와 문의', operatorLine, contactBlock, P('관련 문서: [[/privacy/|개인정보처리방침]] · [[/terms/|이용안내]]')),
    ] }) },
  { slug: 'privacy', title: '개인정보처리방침', build: () => page({
    slug: 'privacy', h1: '개인정보처리방침', metaTitle: '개인정보처리방침: 저장되는 정보와 외부로 전송되는 정보',
    desc: '인스타툰 연재실이 브라우저에 저장하는 정보, AI 기능을 쓸 때 Google Gemini로 전송되는 정보, 글꼴·스크립트 요청, 방문 통계와 향후 광고 도입 시 처리 방식을 안내합니다.',
    lead: '이 방침은 인스타툰 연재실(이하 "사이트")의 실제 동작을 기준으로, 어떤 정보가 어디에 저장되고 어디로 전송되는지를 설명합니다.',
    sections: [
      S('summary', '한눈에 보기', UL('사이트 운영자는 사용자가 입력한 내용, 사진, 이미지, API 키를 **자체 서버에 저장하지 않습니다.** 이 사이트에는 별도의 회원가입과 로그인이 없습니다.', '작업 내용은 사용자의 **브라우저 저장 공간**에 보관됩니다.', 'AI 기능을 쓰면 사용자의 브라우저가 입력 내용을 **Google Gemini API로 직접 전송**합니다.', '방문 통계와 광고는 아래 해당 항목의 "현재 상태"를 확인하세요.')),
      S('local', '1. 브라우저에 저장되는 정보', P('다음 정보는 사용자가 사용하는 브라우저의 localStorage, IndexedDB에 저장되며 운영자에게 전송되지 않습니다.'),
        TBL(['항목', '용도'], ['작성 중인 이야기, 가게 정보, 대본, 연재표, 반응 기록', '작업을 이어서 하기 위해'], ['가게 프로필(말투, 해시태그, 문의 안내 등)', '모든 편에 자동 적용'], ['주인공 사진, 캐릭터 기준 이미지, 완성 그림, 로고', '캐릭터 설명 생성, 저장, 미리보기'], ['Gemini API 키와 모델 이름', 'AI 기능 호출'], ['첫 방문 안내를 봤는지 등 화면 설정', '화면 동작']),
        P('브라우저 설정에서 사이트 데이터를 삭제하면 이 정보도 삭제됩니다. 공용 컴퓨터에서는 사용 후 API 키를 지우고 사이트 데이터를 삭제하세요. "백업 저장"으로 받은 파일은 사용자의 기기에 저장되며 파일 관리 책임은 사용자에게 있습니다.')),
      S('gemini', '2. AI 기능과 Google Gemini', P('대본, 캡션, 한 달 기획, 맞춤법 검사, 댓글 답글 등 AI 기능을 쓰면, 사용자가 입력한 **업종, 가게 이름, 가게 이야기, 가게 프로필, 선택 입력 내용**이 사용자의 브라우저에서 Google의 Gemini API로 직접 전송됩니다. 주인공 사진으로 외모 설명을 만드는 기능을 쓰면 **해당 사진도 함께 전송**됩니다. 이때 사용자가 입력한 API 키가 요청 헤더로 사용됩니다.'),
        P('전송된 정보의 처리와 보관에는 Google의 약관과 개인정보 처리 조건이 적용되며, 키의 요금제에 따라 달라질 수 있습니다. 해당 내용은 Google의 현재 안내를 확인해 주세요. 운영자는 이 전송 내용을 받거나 저장하지 않습니다.'),
        P('**타인의 사진, 고객의 이름·연락처 같은 개인정보는 입력하지 마세요.** 사진은 본인이 동의한 경우에만 사용해야 합니다.')),
      S('image', '3. 이미지 생성', P('이 사이트는 그림을 직접 생성하지 않습니다. 사용자가 프롬프트를 복사해 ChatGPT 등 외부 서비스에 붙여 넣는 경우 그 서비스의 개인정보 처리 방침이 적용됩니다.')),
      S('external', '4. 외부 리소스 요청', P('페이지를 열면 브라우저가 다음 외부 서버에서 글꼴과 스크립트를 불러옵니다. 이 과정에서 사용자의 IP 주소, 브라우저 정보 등이 해당 서비스 제공자에게 전달될 수 있습니다.'),
        UL('Google Fonts(fonts.googleapis.com, fonts.gstatic.com): 글꼴', 'cdnjs.cloudflare.com: 압축 파일 생성(JSZip) 스크립트')),
      S('hosting', '5. 호스팅과 접속 기록', P('이 사이트는 Vercel을 통해 제공됩니다. 호스팅 서비스는 서비스 제공과 보안을 위해 접속 로그(IP 주소, 요청 시각, 브라우저 정보 등)를 처리할 수 있으며, 운영자는 이 로그를 사용자 식별 목적으로 사용하지 않습니다. 구체적인 처리 방식은 호스팅 제공자의 정책을 따릅니다.')),
      gaParagraph(),
      S('ads', '6. 광고', P(`현재(${UPDATED} 기준) 이 사이트에는 광고가 게재되어 있지 않습니다.`),
        P('향후 Google AdSense 등 광고를 게재하게 되면 이 방침을 먼저 갱신합니다. Google을 포함한 제3자 광고 공급업체는 쿠키를 사용해 사용자의 이 사이트 및 다른 사이트 방문 기록을 바탕으로 광고를 게재할 수 있고, 사용자는 Google 광고 설정에서 개인 맞춤 광고를 해제할 수 있습니다. 지역에 따라 필요한 동의 절차를 함께 제공합니다.')),
      S('rights', '7. 이용자의 선택', UL('브라우저의 사이트 데이터 삭제로 저장된 작업 내용과 키를 지울 수 있습니다.', '쿠키 사용은 브라우저 설정으로 제한할 수 있습니다.', 'AI 기능을 쓰지 않으면 입력 내용이 Gemini로 전송되지 않습니다.')),
      S('children', '8. 아동', P('이 사이트는 가게를 운영하거나 홍보하는 성인을 위한 도구이며 아동을 대상으로 하지 않습니다.')),
      S('change', '9. 방침의 변경', P(`이 방침은 사이트 기능이나 사용하는 외부 서비스가 바뀌면 개정합니다. 최종 업데이트: ${UPDATED}.`)),
      S('contact', '10. 문의', operatorLine, contactBlock),
    ] }) },
  { slug: 'terms', title: '이용안내', build: () => page({
    slug: 'terms', h1: '이용안내', metaTitle: '이용안내: 서비스 범위와 이용 시 유의사항',
    desc: '인스타툰 연재실의 서비스 범위, AI 결과물 확인 책임, API 키와 외부 서비스 이용, 저작권·초상권·광고 표현 유의사항, 면책 범위를 안내합니다.',
    lead: '인스타툰 연재실을 이용하기 전에 알아 두면 좋은 내용을 정리했습니다. 이 안내는 일반적인 이용 지침이며 법률 자문이 아닙니다.',
    sections: [
      S('service', '1. 서비스 범위', P('사이트는 인스타툰 대본·글의 초안 생성, 프롬프트 정리, 이미지 정리·저장, 연재 일정과 반응 기록 기능과 가이드 콘텐츠를 제공합니다. 기능은 예고 없이 바뀌거나 중단될 수 있습니다.')),
      S('ai', '2. AI 결과물의 확인 책임', P('AI가 만든 결과는 부정확하거나 사실과 다를 수 있습니다. 게시 전에 상호명, 가격, 영업시간, 효능·성과 표현, 이미지 속 글자, 권리 관계를 사용자가 직접 확인해야 하며, 게시한 콘텐츠에 대한 책임은 게시자에게 있습니다. 확인 항목은 [[ai-instatoon-review-checklist|AI 인스타툰 확인 목록]]을 참고하세요.')),
      S('key', '3. API 키와 외부 서비스', UL('AI 기능에는 사용자가 직접 발급한 Google Gemini API 키가 필요하며, 키의 관리와 사용 요금·한도는 사용자와 Google 사이의 문제입니다.', '그림 생성 등에 사용하는 외부 서비스(예: ChatGPT)는 각 서비스의 약관을 따릅니다.', '키를 타인에게 알려 주거나 공용 기기에 남겨 두지 마세요.')),
      S('content', '4. 입력 콘텐츠와 권리', UL('사용자가 입력하거나 올린 글, 사진, 이미지에 대한 권리는 사용자에게 있습니다.', '타인의 저작물, 상표, 사진, 개인정보를 허락 없이 입력하거나 게시하지 마세요. 사진 속 사람에게는 사용 동의가 필요합니다.', '생성 결과물의 상업적 이용 가능 여부와 조건은 사용한 AI 도구의 약관에 따릅니다.', '참고: [[instagram-content-copyright|저작권 확인 가이드]]')),
      S('prohibited', '5. 금지되는 이용', UL('불법 콘텐츠, 타인을 속이거나 괴롭히는 콘텐츠, 허위·과장 광고를 만드는 용도', '사이트나 외부 서비스를 방해하거나 자동화된 방식으로 과도한 요청을 보내는 행위')),
      S('guide', '6. 가이드 콘텐츠', P('가이드는 일반적인 정보이며 특정 결과를 보장하지 않습니다. Instagram, Facebook, Meta 등 외부 서비스의 기능과 정책은 바뀔 수 있으므로 해당 서비스의 공식 안내를 확인하세요. 법률, 의료, 금융 같은 전문 영역의 판단은 전문가에게 확인하세요.')),
      S('liability', '7. 책임의 한계', P('사이트와 AI 결과물은 있는 그대로 제공되며, 결과물의 정확성이나 특정 목적에의 적합성, 매출·방문·팔로워 증가를 보장하지 않습니다. 법령이 허용하는 범위에서 사용자가 이 사이트를 이용하며 입은 손해에 대한 책임은 제한될 수 있습니다. 이 항목의 구체적 법적 효력은 사업자 정보와 관련 법령에 따라 운영자가 검토해야 합니다.')),
      S('contact', '8. 문의', operatorLine, contactBlock, P(`최종 업데이트: ${UPDATED}`)),
    ] }) },
];
