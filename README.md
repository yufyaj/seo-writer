# SEO Writer

## セットアップ

### CodeGuard セキュリティルールの取得

CodeGuard のセキュリティルールを `ai-docs/security` に配置するには、以下のコマンドを実行してください。

```powershell
# 一時ディレクトリにリポジトリをクローン
git clone https://github.com/project-codeguard/rules.git temp_codeguard

# sources ディレクトリの内容を ai-docs/security にコピー
Copy-Item -Path "temp_codeguard\sources\*" -Destination "ai-docs\security\" -Recurse -Force

# 一時ディレクトリを削除
Remove-Item -Path "temp_codeguard" -Recurse -Force
```

#### ワンライナー

```powershell
git clone https://github.com/project-codeguard/rules.git temp_codeguard; Copy-Item -Path "temp_codeguard\sources\*" -Destination "ai-docs\security\" -Recurse -Force; Remove-Item -Path "temp_codeguard" -Recurse -Force
```
