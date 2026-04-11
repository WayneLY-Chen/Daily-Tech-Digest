-- Migration: 建立 digest_posts 與 processed_urls 資料表

CREATE TABLE IF NOT EXISTS digest_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text        NOT NULL,
  source_url   text        NOT NULL,
  content      text        NOT NULL,
  source       text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processed_urls (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url          text        NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now()
);
