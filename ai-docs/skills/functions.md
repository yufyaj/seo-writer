# Cloud Functions 開発規約

## 技術スタック

- **言語**: Python 3.11+
- **フレームワーク**: Cloud Functions（GCP）/ AWS Lambda / Azure Functions
- **パッケージマネージャー**: Poetry
- **ルートディレクトリ**: `packages/functions`

## 実装時の原則

### 1. コードの品質

- **型ヒントを必ず使用**
  - すべての関数にtype hintsを付与
  - 戻り値の型も明示
  - `mypy`で型チェックを実施

```python
from typing import Dict, List, Optional

def process_data(data: Dict[str, any], limit: int = 100) -> List[str]:
    """データを処理して結果を返す"""
    results: List[str] = []
    # 処理内容
    return results
```

- **関数は単一責任の原則に従う**
  - 1つの関数は1つのことだけを行う
  - 関数名は動詞で始め、何をするかを明確に表現
  - 関数は50行以内を目安に、超える場合は分割を検討

- **Docstringを必ず記述**
  - Google Style Docstringを使用
  - 関数の目的、引数、戻り値、例外を明記

```python
def calculate_score(article: str, keywords: List[str]) -> float:
    """
    記事のSEOスコアを計算する

    Args:
        article: 対象の記事本文
        keywords: 評価対象のキーワードリスト

    Returns:
        0.0から1.0のスコア値

    Raises:
        ValueError: 記事が空の場合

    Examples:
        >>> calculate_score("SEO対策の記事", ["SEO", "対策"])
        0.85
    """
    if not article:
        raise ValueError("記事が空です")
    # 処理内容
    return score
```

### 2. パフォーマンス

- **コールドスタート対策**
  - グローバルスコープで初期化できるものは初期化
  - 接続プールを活用（DB、外部API）
  - 重いライブラリのインポートは必要最小限に

```python
# グローバルスコープで初期化（コールドスタート時のみ実行）
from google.cloud import firestore
db = firestore.Client()

def main(request):
    # この中では何度呼ばれても初期化しない
    result = db.collection('articles').get()
    return result
```

- **タイムアウト対策**
  - 長時間処理は分割してキューで実行
  - タイムアウト値を適切に設定（最大9分）
  - リトライ可能な処理はべき等性を保つ

- **メモリ管理**
  - 大きなデータは一度に読み込まず、ストリーミング処理
  - 不要になった変数は明示的に削除（`del`）
  - メモリ使用量を監視し、適切なメモリサイズを設定

### 3. セキュリティ

- **環境変数**
  - 機密情報は環境変数またはSecret Managerで管理
  - コードに直接書かない
  - `.env`ファイルはGitにコミットしない

```python
import os
from google.cloud import secretmanager

def get_api_key() -> str:
    """Secret ManagerからAPIキーを取得"""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{os.getenv('PROJECT_ID')}/secrets/api-key/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")
```

- **入力検証**
  - すべての外部入力をバリデーション
  - Pydanticでスキーマ検証
  - SQLインジェクション対策（パラメータ化クエリ）

```python
from pydantic import BaseModel, Field, validator

class ArticleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    tags: List[str] = Field(default=[], max_items=5)

    @validator('tags')
    def validate_tags(cls, v):
        return [tag.strip() for tag in v if tag.strip()]
```

- **認証・認可**
  - JWTトークンの検証を必ず実施
  - 権限チェックを実装
  - CORS設定を適切に行う

## TDD開発

### テスト戦略

#### 1. 単体テスト（pytest）

**対象**
- ビジネスロジック
- ユーティリティ関数
- データ変換処理

**配置場所**
```
packages/functions/
  ├── src/
  │   ├── handlers/
  │   │   ├── article_generator.py
  │   │   └── article_generator_test.py
  │   ├── services/
  │   │   ├── seo_analyzer.py
  │   │   └── seo_analyzer_test.py
  │   └── utils/
  │       ├── text_processor.py
  │       └── text_processor_test.py
```

**基本方針**
- テストファイルは対象ファイルと同じディレクトリに`_test.py`サフィックスで配置
- fixtureを活用してテストデータを管理
- カバレッジ目標: 80%以上

**例: 単体テスト**
```python
import pytest
from src.services.seo_analyzer import calculate_keyword_density

class TestSEOAnalyzer:
    def test_keyword_density_calculation(self):
        # Arrange
        text = "SEOは重要です。SEO対策を行いましょう。"
        keyword = "SEO"

        # Act
        density = calculate_keyword_density(text, keyword)

        # Assert
        assert 0.0 <= density <= 1.0
        assert density > 0  # キーワードが含まれているので0より大きい

    def test_keyword_density_empty_text(self):
        # Arrange
        text = ""
        keyword = "SEO"

        # Act & Assert
        with pytest.raises(ValueError):
            calculate_keyword_density(text, keyword)
```

#### 2. 統合テスト

**対象**
- 外部APIとの連携
- データベース操作
- Function全体のフロー

**配置場所**
```
packages/functions/
  └── tests/
      ├── integration/
      │   ├── test_article_generation.py
      │   └── test_database_operations.py
      └── fixtures/
          └── sample_data.json
```

**基本方針**
- モックを使用して外部依存を制御
- テスト用のFirestoreエミュレータを使用
- CI環境でも実行可能にする

**例: 統合テスト**
```python
import pytest
from unittest.mock import Mock, patch
from src.handlers.article_generator import generate_article

@pytest.fixture
def mock_openai_client():
    with patch('src.lib.openai.OpenAI') as mock:
        mock_instance = Mock()
        mock_instance.chat.completions.create.return_value = Mock(
            choices=[Mock(message=Mock(content="生成された記事"))]
        )
        mock.return_value = mock_instance
        yield mock

def test_generate_article_success(mock_openai_client):
    # Arrange
    request_data = {
        "title": "テスト記事",
        "keywords": ["SEO", "マーケティング"]
    }

    # Act
    result = generate_article(request_data)

    # Assert
    assert result["status"] == "success"
    assert "content" in result
    assert len(result["content"]) > 0
```

### TDD開発フロー

1. **Red**: 失敗するテストを書く
2. **Green**: テストが通る最小限の実装
3. **Refactor**: コードを改善
4. **Repeat**: 機能が完成するまで繰り返す

## ディレクトリ構成

```
packages/functions/
├── src/
│   ├── handlers/                # Cloud Functionsのエントリーポイント
│   │   ├── __init__.py
│   │   ├── article_generator.py
│   │   ├── article_generator_test.py
│   │   ├── seo_analyzer.py
│   │   └── seo_analyzer_test.py
│   ├── services/                # ビジネスロジック
│   │   ├── __init__.py
│   │   ├── openai_service.py
│   │   ├── openai_service_test.py
│   │   ├── firestore_service.py
│   │   └── firestore_service_test.py
│   ├── models/                  # データモデル・スキーマ
│   │   ├── __init__.py
│   │   ├── article.py
│   │   └── seo_analysis.py
│   ├── utils/                   # ユーティリティ関数
│   │   ├── __init__.py
│   │   ├── text_processor.py
│   │   ├── text_processor_test.py
│   │   ├── validators.py
│   │   └── validators_test.py
│   ├── lib/                     # 外部ライブラリのラッパー
│   │   ├── __init__.py
│   │   ├── openai.py
│   │   └── firestore.py
│   └── config/                  # 設定ファイル
│       ├── __init__.py
│       └── settings.py
├── tests/                       # 統合テスト
│   ├── integration/
│   │   ├── test_article_generation.py
│   │   └── test_database_operations.py
│   ├── fixtures/
│   │   └── sample_data.json
│   └── conftest.py              # pytest設定
├── scripts/                     # デプロイ・ユーティリティスクリプト
│   ├── deploy.sh
│   └── run_local.py
├── .env.example                 # 環境変数のテンプレート
├── .gitignore
├── pyproject.toml               # Poetry設定
├── poetry.lock
├── pytest.ini
├── mypy.ini
└── README.md
```

## コーディング規約

### 命名規則

- **ファイル名**: snake_case (`article_generator.py`)
- **関数名**: snake_case (`generate_article`, `calculate_score`)
- **クラス名**: PascalCase (`ArticleGenerator`, `SEOAnalyzer`)
- **定数**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_TIMEOUT`)
- **プライベート変数/関数**: アンダースコア接頭辞 (`_internal_function`)

### インポート順序

```python
# 1. 標準ライブラリ
import os
import json
from typing import Dict, List, Optional

# 2. サードパーティライブラリ
import requests
from google.cloud import firestore
from pydantic import BaseModel

# 3. ローカルモジュール
from src.services.openai_service import generate_text
from src.models.article import Article
from src.utils.validators import validate_article
```

### Linter/Formatter

- **Ruff**: 高速なリンター・フォーマッター
- **mypy**: 型チェック
- **black**: コードフォーマッター（Ruffで代替可）

**pyproject.toml設定例**
```toml
[tool.ruff]
line-length = 100
target-version = "py311"
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long (black handles this)
]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["src", "tests"]
python_files = ["*_test.py", "test_*.py"]
addopts = "--cov=src --cov-report=html --cov-report=term-missing"
```

## エラーハンドリング

### カスタム例外

```python
class SEOWriterError(Exception):
    """基底例外クラス"""
    pass

class ValidationError(SEOWriterError):
    """バリデーションエラー"""
    pass

class ExternalAPIError(SEOWriterError):
    """外部API呼び出しエラー"""
    pass

class DatabaseError(SEOWriterError):
    """データベースエラー"""
    pass
```

### Function内でのエラーハンドリング

```python
import logging
from flask import jsonify

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def article_generator(request):
    """
    Cloud Function のエントリーポイント
    """
    try:
        # リクエストの検証
        request_json = request.get_json(silent=True)
        if not request_json:
            return jsonify({"error": "Invalid request"}), 400

        # バリデーション
        article_request = ArticleRequest(**request_json)

        # ビジネスロジック実行
        result = generate_article(article_request)

        return jsonify(result), 200

    except ValidationError as e:
        logger.warning(f"Validation error: {e}")
        return jsonify({"error": str(e)}), 400

    except ExternalAPIError as e:
        logger.error(f"External API error: {e}")
        return jsonify({"error": "External service error"}), 502

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500
```

## 依存関係管理

### Poetryを使用

```bash
# 初期化
poetry init

# パッケージ追加
poetry add openai google-cloud-firestore pydantic

# 開発用パッケージ追加
poetry add --group dev pytest pytest-cov mypy ruff

# 依存関係インストール
poetry install

# 仮想環境で実行
poetry run python src/main.py
```

### pyproject.toml例

```toml
[tool.poetry]
name = "seo-writer-functions"
version = "0.1.0"
description = "SEO記事生成Functions"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
functions-framework = "^3.5.0"
openai = "^1.10.0"
google-cloud-firestore = "^2.14.0"
google-cloud-secret-manager = "^2.18.0"
pydantic = "^2.5.0"
requests = "^2.31.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-cov = "^4.1.0"
pytest-mock = "^3.12.0"
mypy = "^1.8.0"
ruff = "^0.1.0"
types-requests = "^2.31.0"
```

## ロギング

### 構造化ロギング

```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

    def _log(self, level: str, message: str, **kwargs):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            **kwargs
        }
        self.logger.log(
            getattr(logging, level),
            json.dumps(log_entry, ensure_ascii=False)
        )

    def info(self, message: str, **kwargs):
        self._log("INFO", message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log("ERROR", message, **kwargs)

# 使用例
logger = StructuredLogger(__name__)
logger.info("記事生成開始", article_id="abc123", user_id="user456")
```

## モニタリング

### Cloud Monitoring

```python
from google.cloud import monitoring_v3
from google.api_core import datetime_helpers

def write_custom_metric(metric_value: float):
    """カスタムメトリクスを書き込む"""
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{os.getenv('PROJECT_ID')}"

    series = monitoring_v3.TimeSeries()
    series.metric.type = "custom.googleapis.com/article/generation_time"

    now = datetime_helpers.utcnow()
    point = monitoring_v3.Point({
        "interval": {"end_time": now},
        "value": {"double_value": metric_value}
    })
    series.points = [point]

    client.create_time_series(name=project_name, time_series=[series])
```

## デプロイ

### デプロイスクリプト例

```bash
#!/bin/bash
# scripts/deploy.sh

FUNCTION_NAME="article-generator"
REGION="asia-northeast1"
RUNTIME="python311"
ENTRY_POINT="article_generator"
MEMORY="512MB"
TIMEOUT="300s"

gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=$RUNTIME \
  --region=$REGION \
  --source=. \
  --entry-point=$ENTRY_POINT \
  --memory=$MEMORY \
  --timeout=$TIMEOUT \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=$PROJECT_ID \
  --set-secrets 'OPENAI_API_KEY=openai-api-key:latest'
```

### CI/CD

```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Functions

on:
  push:
    branches:
      - main
    paths:
      - 'packages/functions/**'

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Poetry
        run: pip install poetry

      - name: Install dependencies
        run: |
          cd packages/functions
          poetry install

      - name: Run linter
        run: |
          cd packages/functions
          poetry run ruff check .

      - name: Run type check
        run: |
          cd packages/functions
          poetry run mypy src

      - name: Run tests
        run: |
          cd packages/functions
          poetry run pytest

      - name: Deploy to Cloud Functions
        if: success()
        run: |
          cd packages/functions
          ./scripts/deploy.sh
```

## ベストプラクティス

### 1. べき等性の確保

```python
def process_article(article_id: str) -> Dict:
    """
    記事を処理する（べき等な処理）
    """
    # すでに処理済みかチェック
    article = db.collection('articles').document(article_id).get()
    if article.exists and article.to_dict().get('processed'):
        logger.info(f"Article {article_id} already processed")
        return {"status": "already_processed"}

    # 処理実行
    result = perform_processing(article_id)

    # 処理済みフラグを設定
    db.collection('articles').document(article_id).update({
        'processed': True,
        'processed_at': firestore.SERVER_TIMESTAMP
    })

    return result
```

### 2. リトライロジック

```python
import time
from typing import Callable, TypeVar

T = TypeVar('T')

def retry_with_backoff(
    func: Callable[[], T],
    max_retries: int = 3,
    initial_delay: float = 1.0
) -> T:
    """
    指数バックオフでリトライ
    """
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise

            delay = initial_delay * (2 ** attempt)
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {delay}s: {e}")
            time.sleep(delay)

    raise Exception("Max retries exceeded")
```

### 3. 環境変数の管理

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    project_id: str
    openai_api_key: str
    firestore_collection: str = "articles"
    max_retries: int = 3
    timeout_seconds: int = 300

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

## 参考リソース

- [Google Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [Poetry Documentation](https://python-poetry.org/docs/)
