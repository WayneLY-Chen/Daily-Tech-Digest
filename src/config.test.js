import { describe, it, expect } from 'vitest';
import { detectKeyRole, validateEnv } from './config.js';

/** 造一把 Supabase 舊版格式的 JWT（只有 payload 有意義，簽章不驗）。 */
function jwt(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.fake-signature`;
}

const SERVICE_JWT = jwt({ iss: 'supabase', ref: 'abc', role: 'service_role' });
const ANON_JWT = jwt({ iss: 'supabase', ref: 'abc', role: 'anon' });

const validEnv = {
  GEMINI_API_KEY: 'g',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_JWT,
  GITHUB_TOKEN: 't',
};

describe('detectKeyRole', () => {
  it('認得新版不透明金鑰', () => {
    expect(detectKeyRole('sb_secret_abc123')).toBe('service_role');
    expect(detectKeyRole('sb_publishable_abc123')).toBe('anon');
  });

  it('認得舊版 JWT 裡的 role', () => {
    expect(detectKeyRole(SERVICE_JWT)).toBe('service_role');
    expect(detectKeyRole(ANON_JWT)).toBe('anon');
  });

  it('認不出來的格式回 null（不阻擋）', () => {
    expect(detectKeyRole('')).toBeNull();
    expect(detectKeyRole(undefined)).toBeNull();
    expect(detectKeyRole('some-random-self-hosted-key')).toBeNull();
    expect(detectKeyRole('a.b.c')).toBeNull();       // 三段但 payload 不是 JSON
  });
});

describe('validateEnv', () => {
  it('齊全且是 service role 金鑰時通過', () => {
    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('缺變數時列出缺哪些', () => {
    expect(() => validateEnv({ ...validEnv, GEMINI_API_KEY: '' }))
      .toThrow(/缺少必要環境變數：GEMINI_API_KEY/);
  });

  it('現在要求的是 SERVICE_ROLE 而不是 ANON', () => {
    const { SUPABASE_SERVICE_ROLE_KEY, ...withoutServiceKey } = validEnv;
    expect(() => validateEnv({ ...withoutServiceKey, SUPABASE_ANON_KEY: ANON_JWT }))
      .toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('填成 anon 金鑰時擋下，並說明會被 RLS 擋（這正是原本的 bug）', () => {
    expect(() => validateEnv({ ...validEnv, SUPABASE_SERVICE_ROLE_KEY: ANON_JWT }))
      .toThrow(/anon.*不是 service role|RLS/s);
  });

  it('填成新版 publishable 金鑰時同樣擋下', () => {
    expect(() => validateEnv({ ...validEnv, SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_x' }))
      .toThrow(/不是 service role/);
  });

  it('認不出格式的金鑰不阻擋（自架 Supabase 仍可用）', () => {
    expect(() => validateEnv({ ...validEnv, SUPABASE_SERVICE_ROLE_KEY: 'self-hosted-key' }))
      .not.toThrow();
  });
});
