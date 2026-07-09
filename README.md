# OverlayCam Web

カメラ映像にギャラリーの画像を重ねて写真を撮影できるWebアプリです。
Flutter製の [OverlayCam](https://github.com/zawataku/OverlayCam) をWebアプリケーションとしてリアーキテクチャしたものです。

## 機能

- 📷 カメラプレビュー (3:4 / 背面カメラ優先、切り替え対応)
- 🖼️ 端末内の画像をオーバーレイ表示
- ✋ オーバーレイの移動・拡大縮小・回転
  - タッチ: ドラッグ / ピンチ
  - マウス: ドラッグ / ホイールで拡大縮小 / Shift+ホイールで回転
- 📸 カメラ映像のネイティブ解像度でCanvas合成して撮影
- 💾 保存 (ダウンロード) / 📤 共有 (Web Share API 対応環境)

## 技術構成

- [Vite](https://vite.dev/) + TypeScript (UIフレームワークなし・依存ゼロの静的サイト)
- カメラ: `getUserMedia`
- ジェスチャー: Pointer Events
- 合成: Canvas 2D

> **Note**: `getUserMedia` はセキュアコンテキスト (HTTPS または localhost) でのみ動作します。

## 開発

```sh
npm install
npm run dev      # 開発サーバー (http://localhost:5173)
npm run build    # 本番ビルド → dist/
npm run preview  # ビルド結果のプレビュー
```

### スマホ実機での確認 (LAN + HTTPS)

`getUserMedia` はセキュアコンテキスト必須のため、LAN内の実機確認用に自己署名証明書でHTTPS配信するモードがあります。

```sh
npm run dev:lan
```

起動時に表示される `Network: https://<PCのIP>:5173/` にスマホのブラウザでアクセスしてください。
自己署名証明書のため警告が表示されますが、「詳細設定」→「続行」で開けばカメラも動作します。

## Cloudflare Pages へのデプロイ

### ダッシュボードから (Git連携)

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create** → **Pages** → リポジトリを接続
2. ビルド設定:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Deploy を実行

### CLI から (Wrangler)

```sh
npm run build
npx wrangler pages deploy dist --project-name overlaycam-web
```
