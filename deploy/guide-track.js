/* 가이드 페이지 이벤트 추적. GA4(gtag)가 없으면 아무 일도 하지 않는다.
 * 보내는 값: 페이지 종류, 글 slug, 카테고리, 링크 주소/문구뿐이다. 사용자 입력·개인정보·API 키는 읽지도 보내지도 않는다. */
(function () {
  var b = document.body;
  var base = { page_type: b.getAttribute('data-page-type') || '', article_slug: b.getAttribute('data-slug') || '', content_category: b.getAttribute('data-category') || '' };
  function send(name, extra) {
    if (typeof window.gtag !== 'function') return;
    var p = { transport_type: 'beacon' }, k;
    for (k in base) if (base[k]) p[k] = base[k];
    for (k in extra) p[k] = extra[k];
    window.gtag('event', name, p);
  }

  // 1) 스크롤 50/75/90% — 본문(article) 기준, 글당 각 한 번만
  var art = document.querySelector('article');
  if (art && base.page_type === 'article') {
    var marks = [50, 75, 90], fired = {}, ticking = false;
    var check = function () {
      ticking = false;
      var r = art.getBoundingClientRect();
      if (!r.height) return;
      var pct = Math.min(100, Math.max(0, ((window.innerHeight - r.top) / r.height) * 100));
      marks.forEach(function (m) { if (pct >= m && !fired[m]) { fired[m] = 1; send('article_scroll', { percent: m }); } });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  }

  // 2) 링크 클릭: <a data-track="related|cta|prevnext|guide_card" data-loc data-pos>
  var EVT = { related: 'related_click', cta: 'cta_click', prevnext: 'prevnext_click', guide_card: 'guide_card_click' };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-track]') : null;
    if (!a) return;
    var name = EVT[a.getAttribute('data-track')];
    if (!name) return;
    var href = a.getAttribute('href') || '';
    var m = href.match(/^\/guide\/([^\/]+)\/?$/);
    var p = { link_url: href, link_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
    if (m) p.target_slug = m[1];
    if (a.getAttribute('data-loc')) p.location = a.getAttribute('data-loc');
    if (a.getAttribute('data-pos')) p.position = Number(a.getAttribute('data-pos'));
    send(name, p);
  }, true);
})();
