# チャット機能セットアップガイド

このプロジェクトにはCloudflare Durable Objectsを使用したリアルタイムチャット機能が実装されています。

## 🏗️ アーキテクチャ

- **Next.js 15** - フロントエンドフレームワーク
- **Cloudflare Durable Objects** - WebSocket接続とチャットルーム管理
- **Drizzle ORM** - データベース操作
- **Cloudflare D1** - SQLiteベースのデータベース
- **TypeScript** - 型安全性

## 📋 セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Cloudflare D1データベースの作成
```bash
# D1データベースを作成
npx wrangler d1 create chat-database

# 出力されたdatabase_idをwrangler.jsonc の "database_id" に設定
```

### 3. wrangler.jsonc の設定
`wrangler.jsonc` の `d1_databases` セクションの `database_id` を実際のIDに更新してください：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "chat-database",
    "database_id": "あなたのデータベースID"
  }
]
```

### 4. データベースマイグレーション
```bash
# マイグレーションを実行
npx wrangler d1 migrations apply chat-database --remote
```

### 5. 環境変数の設定（オプション）
開発環境で`.dev.vars`ファイルを作成：
```
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_DATABASE_ID=your-database-id
CLOUDFLARE_API_TOKEN=your-api-token
```

## 🚀 使用方法

### 開発環境での実行
```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開き、「Join Chat」ボタンをクリックしてチャットルームに参加できます。

### 本番環境へのデプロイ
```bash
npm run deploy
```

## 🔧 利用可能なスクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run deploy` - Cloudflareにデプロイ
- `npm run db:generate` - Drizzleスキーマからマイグレーション生成
- `npm run db:migrate` - ローカルマイグレーション実行
- `npm run db:studio` - Drizzle Studio起動

## 📁 プロジェクト構造

```
src/
├── app/
│   ├── chat/[roomId]/     # チャットページ
│   └── api/chat/          # API routes
├── components/
│   └── ChatRoom.tsx       # チャットUIコンポーネント
├── durable-objects/
│   └── ChatRoom.ts        # Durable Objectクラス
├── db/
│   └── schema.ts          # データベーススキーマ
└── worker.ts              # Cloudflare Workerエントリーポイント
```

## 🔗 チャット機能の使用

1. メインページの「Join Chat」ボタンをクリック
2. ユーザー名を入力してチャットルームに参加
3. リアルタイムでメッセージの送受信が可能
4. 複数のユーザーが同時に参加可能

## 🎯 機能

- ✅ リアルタイムメッセージ送受信
- ✅ ユーザー参加/退出通知
- ✅ チャット履歴の永続化
- ✅ レスポンシブデザイン
- ✅ WebSocket自動再接続
- ✅ 複数チャットルーム対応

## 🐛 トラブルシューティング

### WebSocket接続エラー
- Cloudflare Workersが正しくデプロイされているか確認
- wrangler.jsonc の設定が正しいか確認

### データベースエラー
- D1データベースが作成されているか確認
- マイグレーションが適用されているか確認

### ビルドエラー
- 依存関係が正しくインストールされているか確認
- TypeScriptエラーがないか確認: `npm run check`

## 📚 参考リンク

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Next.js](https://nextjs.org/docs)