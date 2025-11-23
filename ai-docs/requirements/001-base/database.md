# データベース定義書

AI 記事自動生成・WordPress自動投稿システム（キーワード戦略JSON版）

---

## 1. 概要

本システムは PostgreSQL を使用する。
主なテーブル構成は以下の通りです。

* `users` … ログインユーザー
* `companies` … 会社情報＋WordPressサイト設定（`users` と 1-1）
* `post_profiles` … 投稿プロファイル（「種類」＋キーワード戦略JSON）
* `post_profile_article_types` … プロファイルごとの記事タイプ（内容パターン）
* `post_profile_schedules` … プロファイルごとのスケジュール（1-1）
* `jobs` … バッチ実行（ジョブ）ログ
* `job_items` … 記事単位の実行ログ（使用キーワード文字列を含む）

※ 旧案にあった `keywords` テーブルは廃止し、
　**キーワード戦略は `post_profiles.keyword_strategy(JSONB)` に集約**します。

---

## 2. ER 図（関係イメージ）

* `users` 1 ─── 1 `companies`
* `companies` 1 ─── n `post_profiles`
* `post_profiles` 1 ─── n `post_profile_article_types`
* `post_profiles` 1 ─── 1 `post_profile_schedules`
* `post_profiles` 1 ─── n `jobs`
* `jobs` 1 ─── n `job_items`
* `post_profiles` 1 ─── n `job_items`
* `post_profile_article_types` 1 ─── n `job_items`

---

## 3. テーブル定義

### 3.1 `users` テーブル

ログインユーザーを管理する。

#### カラム定義

| カラム名          | 型            | NOT NULL | 制約            | 説明        |
| ------------- | ------------ | -------- | ------------- | --------- |
| id            | BIGSERIAL    | YES      | PK            | ユーザーID    |
| email         | VARCHAR(255) | YES      | UNIQUE        | メールアドレス   |
| password_hash | VARCHAR(255) | YES      |               | パスワードハッシュ |
| created_at    | TIMESTAMPTZ  | YES      | DEFAULT NOW() | 作成日時      |
| updated_at    | TIMESTAMPTZ  | YES      | DEFAULT NOW() | 更新日時      |

#### DDL（例）

```sql
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.2 `companies` テーブル

会社情報と WordPress サイト設定を管理する（`users` と 1-1）。

#### カラム定義

| カラム名                        | 型            | NOT NULL | 制約                      | 説明                                     |
| --------------------------- | ------------ | -------- | ----------------------- | -------------------------------------- |
| id                          | BIGSERIAL    | YES      | PK                      | 会社ID                                   |
| user_id                     | BIGINT       | YES      | UNIQUE, FK → `users.id` | 紐づくユーザーID（1ユーザー=1会社）                   |
| company_name                | VARCHAR(255) | YES      |                         | 会社名（正式名称）                              |
| brand_name                  | VARCHAR(255) | NO       |                         | ブランド名                                  |
| about_text                  | TEXT         | NO       |                         | 会社紹介文                                  |
| site_url                    | VARCHAR(255) | NO       |                         | 自社サイト URL                              |
| contact_url                 | VARCHAR(255) | NO       |                         | お問い合わせ / LP URL                        |
| wp_base_url                 | VARCHAR(255) | YES      |                         | WordPress ベース URL                      |
| wp_username                 | VARCHAR(255) | YES      |                         | WP REST 用ユーザー名                         |
| wp_app_password_secret_name | VARCHAR(255) | YES      |                         | Secret Manager 上の Application Password |
| wp_default_status           | VARCHAR(20)  | YES      | DEFAULT 'draft'         | デフォルト投稿ステータス                           |
| created_at                  | TIMESTAMPTZ  | YES      | DEFAULT NOW()           | 作成日時                                   |
| updated_at                  | TIMESTAMPTZ  | YES      | DEFAULT NOW()           | 更新日時                                   |

#### DDL（例）

```sql
CREATE TABLE companies (
  id        BIGSERIAL PRIMARY KEY,
  user_id   BIGINT NOT NULL UNIQUE REFERENCES users(id),

  company_name  VARCHAR(255) NOT NULL,
  brand_name    VARCHAR(255),
  about_text    TEXT,
  site_url      VARCHAR(255),
  contact_url   VARCHAR(255),

  wp_base_url                 VARCHAR(255) NOT NULL,
  wp_username                 VARCHAR(255) NOT NULL,
  wp_app_password_secret_name VARCHAR(255) NOT NULL,
  wp_default_status           VARCHAR(20)  NOT NULL DEFAULT 'draft',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.3 `post_profiles` テーブル

投稿プロファイル（「種類」）と、
そのプロファイルに紐づく **キーワード戦略JSON** を管理する。

#### カラム定義

| カラム名             | 型            | NOT NULL | 制約                  | 説明                             |
| ---------------- | ------------ | -------- | ------------------- | ------------------------------ |
| id               | BIGSERIAL    | YES      | PK                  | プロファイルID                       |
| company_id       | BIGINT       | YES      | FK → `companies.id` | 紐づく会社ID                        |
| name             | VARCHAR(255) | YES      |                     | プロファイル名（種類名）                   |
| description      | TEXT         | NO       |                     | プロファイル説明                       |
| wp_category_id   | BIGINT       | NO       |                     | 投稿先 WordPress カテゴリID           |
| keyword_strategy | JSONB        | NO       |                     | キーワード戦略JSON（strategy_concept等） |
| is_active        | BOOLEAN      | YES      | DEFAULT TRUE        | 有効フラグ                          |
| created_at       | TIMESTAMPTZ  | YES      | DEFAULT NOW()       | 作成日時                           |
| updated_at       | TIMESTAMPTZ  | YES      | DEFAULT NOW()       | 更新日時                           |

#### DDL（例）

```sql
CREATE TABLE post_profiles (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES companies(id),

  name        VARCHAR(255) NOT NULL,
  description TEXT,

  wp_category_id   BIGINT,

  -- キーワード戦略JSON（strategy_concept, transactional_cv, ...）
  keyword_strategy JSONB,

  is_active   BOOLEAN NOT NULL DEFAULT TRUE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.4 `post_profile_article_types` テーブル

各投稿プロファイルごとの「記事タイプ（内容パターン）」を管理する。

#### カラム定義

| カラム名            | 型            | NOT NULL | 制約                      | 説明                    |
| --------------- | ------------ | -------- | ----------------------- | --------------------- |
| id              | BIGSERIAL    | YES      | PK                      | 記事タイプID               |
| post_profile_id | BIGINT       | YES      | FK → `post_profiles.id` | 紐づくプロファイルID           |
| name            | VARCHAR(255) | YES      |                         | 記事タイプ名（例：AIのよくある失敗5選） |
| description     | TEXT         | NO       |                         | 管理画面用説明               |
| prompt_template | TEXT         | YES      |                         | LLM用テンプレ（構成・書き方などを含む） |
| is_enabled      | BOOLEAN      | YES      | DEFAULT TRUE            | 有効フラグ                 |
| created_at      | TIMESTAMPTZ  | YES      | DEFAULT NOW()           | 作成日時                  |
| updated_at      | TIMESTAMPTZ  | YES      | DEFAULT NOW()           | 更新日時                  |

#### DDL（例）

```sql
CREATE TABLE post_profile_article_types (
  id              BIGSERIAL PRIMARY KEY,
  post_profile_id BIGINT NOT NULL REFERENCES post_profiles(id),

  name        VARCHAR(255) NOT NULL,
  description TEXT,

  prompt_template TEXT NOT NULL,

  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.5 `post_profile_schedules` テーブル

各投稿プロファイルの自動実行スケジュールを管理する（`post_profiles` と 1-1）。

#### カラム定義

| カラム名               | 型           | NOT NULL | 制約                          | 説明                                      |
| ------------------ | ----------- | -------- | --------------------------- | --------------------------------------- |
| post_profile_id    | BIGINT      | YES      | PK, FK → `post_profiles.id` | 紐づくプロファイルID                             |
| schedule_type      | VARCHAR(20) | YES      | DEFAULT 'none'              | `none` / `daily` / `weekly` / `cron` など |
| daily_time         | TIME        | NO       |                             | 毎日実行する時刻（`daily` 用）                     |
| weekly_day_of_week | INT         | NO       |                             | 毎週実行する曜日（1=Mon〜7=Sun など）                |
| weekly_time        | TIME        | NO       |                             | 毎週実行する時刻                                |
| cron_expression    | TEXT        | NO       |                             | cron形式の文字列（高度なスケジュール用）                  |
| is_enabled         | BOOLEAN     | YES      | DEFAULT FALSE               | スケジュール有効フラグ                             |
| created_at         | TIMESTAMPTZ | YES      | DEFAULT NOW()               | 作成日時                                    |
| updated_at         | TIMESTAMPTZ | YES      | DEFAULT NOW()               | 更新日時                                    |

#### DDL（例）

```sql
CREATE TABLE post_profile_schedules (
  post_profile_id BIGINT PRIMARY KEY REFERENCES post_profiles(id),

  schedule_type   VARCHAR(20) NOT NULL DEFAULT 'none',
  -- 'none' / 'daily' / 'weekly' / 'cron'

  daily_time         TIME,
  weekly_day_of_week INT,
  weekly_time        TIME,
  cron_expression    TEXT,

  is_enabled     BOOLEAN NOT NULL DEFAULT FALSE,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.6 `jobs` テーブル

バッチ実行（ジョブ）単位のログを管理する。

#### カラム定義

| カラム名            | 型           | NOT NULL | 制約                      | 説明                                                  |
| --------------- | ----------- | -------- | ----------------------- | --------------------------------------------------- |
| id              | BIGSERIAL   | YES      | PK                      | ジョブID                                               |
| post_profile_id | BIGINT      | YES      | FK → `post_profiles.id` | 対象となった投稿プロファイルID                                    |
| trigger_type    | VARCHAR(20) | YES      |                         | 実行トリガ：`manual` / `scheduler`                        |
| status          | VARCHAR(20) | YES      |                         | `running` / `success` / `partial_failed` / `failed` |
| started_at      | TIMESTAMPTZ | YES      | DEFAULT NOW()           | 実行開始時刻                                              |
| finished_at     | TIMESTAMPTZ | NO       |                         | 実行終了時刻                                              |
| error_message   | TEXT        | NO       |                         | ジョブ全体に関するエラーメッセージ                                   |

#### DDL（例）

```sql
CREATE TABLE jobs (
  id              BIGSERIAL PRIMARY KEY,
  post_profile_id BIGINT NOT NULL REFERENCES post_profiles(id),

  trigger_type    VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL,

  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  error_message   TEXT
);
```

---

### 3.7 `job_items` テーブル

記事単位の実行結果を管理する。
**キーワードは JSON から選んだ文字列をそのまま保存**する。

#### カラム定義

| カラム名                         | 型            | NOT NULL | 制約                                   | 説明                        |
| ---------------------------- | ------------ | -------- | ------------------------------------ | ------------------------- |
| id                           | BIGSERIAL    | YES      | PK                                   | Job Item ID               |
| job_id                       | BIGINT       | YES      | FK → `jobs.id`                       | 紐づくジョブID                  |
| post_profile_id              | BIGINT       | YES      | FK → `post_profiles.id`              | 紐づくプロファイルID               |
| post_profile_article_type_id | BIGINT       | YES      | FK → `post_profile_article_types.id` | 使用した記事タイプID               |
| keyword                      | VARCHAR(255) | NO       |                                      | 使用したキーワード文字列              |
| title                        | VARCHAR(512) | NO       |                                      | 生成された記事タイトル               |
| wp_post_id                   | BIGINT       | NO       |                                      | 投稿された WordPress の Post ID |
| wp_post_url                  | VARCHAR(512) | NO       |                                      | 投稿された WordPress の URL     |
| status                       | VARCHAR(20)  | YES      |                                      | `success` / `failed`      |
| error_message                | TEXT         | NO       |                                      | 記事単位のエラーメッセージ             |
| created_at                   | TIMESTAMPTZ  | YES      | DEFAULT NOW()                        | 作成日時                      |

#### DDL（例）

```sql
CREATE TABLE job_items (
  id                           BIGSERIAL PRIMARY KEY,
  job_id                       BIGINT NOT NULL REFERENCES jobs(id),

  post_profile_id              BIGINT NOT NULL REFERENCES post_profiles(id),
  post_profile_article_type_id BIGINT NOT NULL REFERENCES post_profile_article_types(id),

  -- 使用したキーワード（keyword_strategy JSON から選んだ文字列）
  keyword       VARCHAR(255),

  title         VARCHAR(512),
  wp_post_id    BIGINT,
  wp_post_url   VARCHAR(512),

  status        VARCHAR(20) NOT NULL,
  error_message TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---