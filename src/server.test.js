import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

// 把整條流水線換成假的：測的是 /run 的授權與單飛鎖，不該真的去抓 GitHub /
// 呼叫 Gemini / 連資料庫。
vi.mock('./pipeline.js', () => ({ run: vi.fn() }));

const TOKEN = 'test-run-token-abc123';

// server.js 在 import 時就把 RUN_TOKEN 讀進一個 const，所以每個情境都要先設好
// 環境變數、resetModules、再動態 import 一份新的 app。
async function loadApp({ token } = {}) {
  vi.resetModules();
  if (token === undefined) delete process.env.RUN_TOKEN;
  else process.env.RUN_TOKEN = token;
  const server = await import('./server.js');
  const pipeline = await import('./pipeline.js');
  return { app: server.app, run: pipeline.run };
}

describe('POST /run — 授權與單飛鎖', () => {
  afterEach(() => {
    delete process.env.RUN_TOKEN;
    vi.clearAllMocks();
  });

  it('未設定 RUN_TOKEN 時 fail-closed 回 503，且不呼叫 run', async () => {
    const { app, run } = await loadApp({ token: undefined });
    const res = await request(app).post('/run');
    expect(res.status).toBe(503);
    expect(run).not.toHaveBeenCalled();
  });

  it('沒帶密鑰標頭回 401', async () => {
    const { app, run } = await loadApp({ token: TOKEN });
    const res = await request(app).post('/run');
    expect(res.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('密鑰錯誤回 401', async () => {
    const { app, run } = await loadApp({ token: TOKEN });
    const res = await request(app).post('/run').set('x-run-token', 'wrong-token');
    expect(res.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('密鑰正確時放行，回傳 run 的結果', async () => {
    const { app, run } = await loadApp({ token: TOKEN });
    run.mockResolvedValue({ processed: 3 });
    const res = await request(app).post('/run').set('x-run-token', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ processed: 3 });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('已有一條在跑時，第二個併發請求回 409', async () => {
    const { app, run } = await loadApp({ token: TOKEN });
    let release;
    run.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ ok: true }); }),
    );
    // .then() 才會真的把請求送出去（supertest 的 request 是延遲送出的）。
    const first = request(app).post('/run').set('x-run-token', TOKEN).then((r) => r);
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1)); // 等鎖上好
    const second = await request(app).post('/run').set('x-run-token', TOKEN);
    expect(second.status).toBe(409);
    release();
    expect((await first).status).toBe(200);
  });

  it('鎖在請求結束後會釋放（下一次仍可跑）', async () => {
    const { app, run } = await loadApp({ token: TOKEN });
    run.mockResolvedValue({ ok: 1 });
    expect((await request(app).post('/run').set('x-run-token', TOKEN)).status).toBe(200);
    expect((await request(app).post('/run').set('x-run-token', TOKEN)).status).toBe(200);
  });

  it('run 拋錯時回 500，且不把內部錯誤細節外流', async () => {
    const { app, run } = await loadApp({ token: TOKEN });
    run.mockRejectedValue(new Error('SECRET_INTERNAL_DETAIL'));
    const res = await request(app).post('/run').set('x-run-token', TOKEN);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('SECRET_INTERNAL_DETAIL');
  });
});
