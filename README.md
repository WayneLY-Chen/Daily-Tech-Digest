# Daily Tech Digest

一個高效、由 AI 驅動的技術新聞聚合與摘要流水線。本系統會自動從 GitHub Trending 與 Hacker News 抓取熱門專案與討論，並利用 Google Gemini 2.5 Flash 生成精簡的繁體中文技術摘要，最後透過現代化的網頁介面呈現。

## 🚀 核心功能

- **自動化 AI 摘要**：整合 Google Gemini API，將複雜的技術內容轉化為易讀的繁體中文重點。
- **多來源聚合**：
    - **GitHub Trending**：精確鎖定高影響力的 AI 與 Python 開源專案。
    - **Hacker News**：捕捉全球開發者社群頂層的技術討論。
- **系統架構**：
    - **解耦設計**：Fetch (抓取)、Summarize (摘要) 與 Publish (發布) 分層管理，易於擴充。
    - **內建查重機制**：使用 Supabase PostgreSQL 確保內容不重複處理，節省資源。
    - **現代化前端**：基於 Vue 3 與 Vite 打造，支援深色模式。
- **生產環境就緒**：支援 HTTP POST 端點，可輕鬆整合 n8n、GitHub Actions 或其他排程工具。
- **自動化摘要數量**：系統預設每日處理 **10 筆** 最新文章，可透過系統設定進行調整。

---

## 🛠️ 技術棧

- **後端 (Backend)**：Node.js (ESM), Express
- **前端 (Frontend)**：Vue 3, Vite, CSS (Glassmorphism 效果)
- **資料庫 (Database)**：Supabase (PostgreSQL)
- **AI 引擎**：Google Gemini 2.5 Flash

---

## ⚠️ API 額度與流量限制

本系統使用 **Google Gemini API** 的免費層級 (Free Tier)，因此在使用上有一些限制，請知悉：

1. **429 Too Many Requests**：這是常見的流量限制錯誤。當系統一次處理過多新文章時，可能會觸發此錯誤。目前系統已內建「自動重試機制」，會稍作等待後再次嘗試。
2. **每日額度限制**：Gemini 免費版有每日調用次數上限。若當天已達到上限，摘要功能將暫時無法使用，需等到隔日恢復。
3. **付費建議**：若您需要更穩定的體驗或更大量的摘要，建議使用 **Pay-as-you-go** 方案，或於設定中調低每日處理篇數。

---

## 📦 快速開始

### 1. 安裝依賴

請在專案根目錄與前端目錄分別執行安裝：

```bash
npm install
cd frontend && npm install
```

### 2. 環境變數設定

請參考 `.env.example` 建立正式的環境設定檔。

**專案根目錄 `.env`**：
```env
GEMINI_API_KEY=您的_API_KEY
SUPABASE_URL=您的_SUPABASE_URL
SUPABASE_ANON_KEY=您的_SUPABASE_ANON_KEY
GITHUB_TOKEN=您的_GITHUB_TOKEN
```

**前端目錄 `frontend/.env`**：
```env
VITE_SUPABASE_URL=您的_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=您的_SUPABASE_ANON_KEY
```

### 3. 初始化資料庫

在 Supabase 的 SQL Editor 中執行以下腳本以建立必要的資料表：

```sql
CREATE TABLE digest_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  source_url text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE processed_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- 開啟資料列級別安全 (RLS)
ALTER TABLE digest_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允許公開讀取" ON digest_posts FOR SELECT USING (true);
CREATE POLICY "僅限服務金鑰寫入" ON digest_posts FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "允許公開讀取已處理 URL" ON processed_urls FOR SELECT USING (true);
CREATE POLICY "僅限服務金鑰寫入 URL" ON processed_urls FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## 🚀 運行方式

### Windows 使用者 (捷徑)
> [!IMPORTANT]
> 在執行啟動腳本前，請務必先依照「環境變數設定」一節建立您的 `.env` 檔案並填入金鑰，否則系統將無法運作。

本專案已內建全自動啟動腳本，您只需在專案目錄下：
- **雙擊 `啟動全系統.bat`**：系統將自動執行「資料抓取」並「啟動前端介面」。

### 開發者模式 (CLI)
- **執行抓取流水線**：`node src/index.js`
- **啟動 HTTP 伺服器**：`node src/server.js` (透過 POST `/run` 觸發)
- **單獨啟動前端**：`cd frontend && npm run dev`

---

## ⚙️ 系統設定

若需調整系統運行參數（如每日抓取數量），請修改：
- **檔案路徑**：`src/config.js`
- **關鍵參數**：`maxDailyItems` (預設為 10)
  - 您可以直接修改程式碼中的預設值，或在環境變數中設定 `MAX_DAILY_ITEMS`。

---

## 📜 授權協議

本專案採用 [MIT License](LICENSE) 授權。
