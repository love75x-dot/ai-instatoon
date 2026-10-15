// Cloudflare Worker 진입점: /api/* 만 이 Worker가 먼저 받고(wrangler.jsonc의 assets.run_worker_first), 나머지는 정적 에셋이 그대로 처리한다.
import { DurableObject } from 'cloudflare:workers';
import { handle, publicConfig, QuotaStore } from './core.js';

/** 하루 사용 횟수 저장소(Durable Object, SQLite). 입력·결과는 저장하지 않고 "IP 해시+날짜별 횟수"만 둔다. */
export class Quota extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.q = new QuotaStore(ctx.storage); }
  begin(day, uh, task, limit) { return this.q.begin(day, uh, task, limit); }
  refund(day, uh, task) { return this.q.refund(day, uh, task); }
  canUse(day, name, cap, nowMs) { return this.q.canUse(day, name, cap, nowMs); }
  block(name, untilMs) { return this.q.block(name, untilMs); }
  used(day, name) { return this.q.used(day, name); }
}

const quotaOf = (env) => (env.QUOTA ? env.QUOTA.get(env.QUOTA.idFromName('main')) : null);

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/ai/config' && request.method === 'GET')
      return new Response(JSON.stringify(publicConfig(env, !!env.QUOTA)), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
    if (pathname === '/api/ai') return handle(request, env, { quota: quotaOf(env) });
    return new Response(JSON.stringify({ ok: false, code: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
  },
};
