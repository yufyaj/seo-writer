# Web アプリケーション開発規約

## 技術スタック

- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **パッケージマネージャー**: pnpm
- **ルートディレクトリ**: `packages/web`

## 実装時の原則

### 1. コードの品質

- **型安全性を最優先**
  - `any`の使用は禁止。必要な場合は`unknown`を使用し、型ガードで絞り込む
  - `as`によるキャストは最小限に抑え、型ガードや型述語を優先
  - オプショナルチェイニング(`?.`)とNull合体演算子(`??`)を活用

- **関数は単一責任の原則に従う**
  - 1つの関数は1つのことだけを行う
  - 関数名は動詞で始め、何をするかを明確に表現
  - 引数は最大3つまで。それ以上必要な場合はオブジェクトにまとめる

- **コンポーネント設計**
  - Server ComponentsとClient Componentsを適切に使い分ける
  - `'use client'`は必要最小限のコンポーネントにのみ付与
  - Props Drillingが3階層以上になる場合はContext APIまたはState管理を検討
  - コンポーネントは100行以内を目安に、超える場合は分割を検討

### 2. パフォーマンス

- **画像最適化**
  - `next/image`を必ず使用
  - 適切な`width`、`height`、`sizes`属性を指定
  - 重要な画像には`priority`を指定

- **レンダリング戦略**
  - 可能な限りServer Componentsを使用
  - 動的データはISR（Incremental Static Regeneration）を活用
  - キャッシュ戦略を明示的に指定（`revalidate`、`cache`オプション）

- **バンドルサイズ**
  - Dynamic Importsで必要な時だけコンポーネントを読み込む
  - tree-shakingを意識したライブラリ選定
  - `next/bundle-analyzer`で定期的にバンドルサイズを確認

### 3. セキュリティ

- **環境変数**
  - クライアントに公開する環境変数は`NEXT_PUBLIC_`プレフィックスを付ける
  - 機密情報は絶対にクライアント側に含めない
  - `.env.local`はGitにコミットしない

- **XSS対策**
  - ユーザー入力は必ずサニタイズ
  - `dangerouslySetInnerHTML`は使用禁止（どうしても必要な場合はDOMPurifyを使用）

- **認証・認可**
  - 認証状態はServer Componentsで検証
  - APIルートでは必ず認証チェックを実装
  - JWTトークンはhttpOnlyクッキーで管理

## TDD開発

### テスト戦略

#### 1. 単体テスト（Jest + React Testing Library）

**対象**
- ユーティリティ関数
- カスタムフック
- コンポーネントのロジック

**配置場所**
```
packages/web/
  ├── src/
  │   ├── components/
  │   │   ├── Button/
  │   │   │   ├── Button.tsx
  │   │   │   └── Button.test.tsx
  │   ├── utils/
  │   │   ├── format.ts
  │   │   └── format.test.ts
  │   └── hooks/
  │       ├── useAuth.ts
  │       └── useAuth.test.ts
```

**基本方針**
- テストファイルは対象ファイルと同じディレクトリに配置
- テストは「Arrange（準備）→ Act（実行）→ Assert（検証）」の順序で記述
- カバレッジ目標: 80%以上

**例: コンポーネントテスト**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('クリックされたときにonClickハンドラが呼ばれる', async () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>クリック</Button>);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'クリック' }));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 2. E2Eテスト（Playwright）

**対象**
- ユーザーフロー全体
- クリティカルパス

**配置場所**
```
packages/web/
  └── e2e/
      ├── auth.spec.ts
      ├── article-creation.spec.ts
      └── fixtures/
```

**基本方針**
- 重要なユーザーフローのみE2Eテストを作成
- Page Object Modelパターンを使用
- テストデータはfixturesで管理

**例: E2Eテスト**
```typescript
import { test, expect } from '@playwright/test';

test('ユーザーがログインできる', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

### TDD開発フロー

1. **Red**: 失敗するテストを書く
2. **Green**: テストが通る最小限の実装
3. **Refactor**: コードを改善
4. **Repeat**: 機能が完成するまで繰り返す

## ディレクトリ構成

```
packages/web/
├── public/                      # 静的ファイル
│   ├── images/
│   └── fonts/
├── src/
│   ├── app/                     # App Router
│   │   ├── (auth)/              # ルートグループ（認証あり）
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (public)/            # ルートグループ（認証なし）
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/
│   │   │   │   └── route.ts
│   │   │   └── articles/
│   │   │       └── route.ts
│   │   ├── layout.tsx           # ルートレイアウト
│   │   └── page.tsx             # トップページ
│   ├── components/              # 共通コンポーネント
│   │   ├── ui/                  # UIコンポーネント（Button, Input等）
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   └── Input/
│   │   ├── features/            # 機能別コンポーネント
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm/
│   │   │   │   └── SignupForm/
│   │   │   └── article/
│   │   │       ├── ArticleList/
│   │   │       └── ArticleCard/
│   │   └── layouts/             # レイアウトコンポーネント
│   │       ├── Header/
│   │       └── Footer/
│   ├── lib/                     # 外部ライブラリの設定・ラッパー
│   │   ├── supabase.ts
│   │   └── openai.ts
│   ├── hooks/                   # カスタムフック
│   │   ├── useAuth.ts
│   │   ├── useAuth.test.ts
│   │   └── useArticles.ts
│   ├── utils/                   # ユーティリティ関数
│   │   ├── format.ts
│   │   ├── format.test.ts
│   │   └── validators.ts
│   ├── types/                   # 型定義
│   │   ├── article.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── constants/               # 定数
│   │   └── config.ts
│   └── styles/                  # グローバルスタイル
│       └── globals.css
├── e2e/                         # E2Eテスト
│   ├── auth.spec.ts
│   └── fixtures/
├── .env.local.example           # 環境変数のテンプレート
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── next.config.js
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## コーディング規約

### 命名規則

- **ファイル名**
  - コンポーネント: PascalCase (`Button.tsx`)
  - ユーティリティ: camelCase (`formatDate.ts`)
  - 定数: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT.ts`)

- **変数・関数名**
  - camelCase (`getUserName`, `isLoading`)
  - Boolean型は`is`, `has`, `should`で始める
  - イベントハンドラは`handle`で始める (`handleClick`)

- **型・インターフェース名**
  - PascalCase (`User`, `ArticleProps`)
  - Propsの型は`ComponentNameProps`の形式

### インポート順序

```typescript
// 1. React関連
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. 外部ライブラリ
import { z } from 'zod';

// 3. 内部モジュール（絶対パス）
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user';

// 4. 相対パス
import { formatDate } from './utils';

// 5. スタイル
import styles from './Component.module.css';
```

### ESLintルール

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react/jsx-no-leaked-render": "error",
    "react/self-closing-comp": "error"
  }
}
```

## 状態管理

### 基本方針

- **ローカル状態**: `useState`
- **グローバル状態（軽量）**: React Context API
- **サーバーステート**: TanStack Query（React Query）
- **複雑な状態管理**: Zustand

### サーバーステートの管理例

```typescript
import { useQuery } from '@tanstack/react-query';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分
  });
}
```

## エラーハンドリング

### クライアント側

```typescript
// error.tsx（Next.js App Router）
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

### API Routes

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## バリデーション

### Zodを使用したスキーマ定義

```typescript
import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100),
  content: z.string().min(1, '本文は必須です'),
  tags: z.array(z.string()).max(5, 'タグは5つまでです'),
});

export type Article = z.infer<typeof articleSchema>;
```

## パフォーマンスモニタリング

### Core Web Vitals

- **LCP** (Largest Contentful Paint): 2.5秒以内
- **FID** (First Input Delay): 100ms以内
- **CLS** (Cumulative Layout Shift): 0.1以内

### モニタリングツール

- Next.js Analytics
- Vercel Speed Insights
- Lighthouse CI（CI/CDパイプライン）

## デプロイ

### 環境

- **Development**: ローカル開発環境
- **Staging**: プレビュー環境（Vercel Preview）
- **Production**: 本番環境

### CI/CD

1. PR作成時
   - ESLintチェック
   - 型チェック（`tsc --noEmit`）
   - 単体テスト実行
   - E2Eテスト実行
   - Lighthouseスコアチェック

2. mainブランチマージ時
   - ビルド
   - 本番デプロイ

## 参考リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
