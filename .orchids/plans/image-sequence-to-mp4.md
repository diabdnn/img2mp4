# Image Sequence to MP4 Video Generator

## Requirements

MediaBunnyライブラリを使用して、画像の連番ファイルとFPS設定だけでMP4動画を生成できるWebアプリケーションを構築する。UIはshadcn/uiを使用し、ダーク/ライトテーマ切り替えと日本語/英語の多言語対応を実装する。

### Core Features
- 画像ファイルの連番アップロード（ドラッグ＆ドロップ対応）
- FPS設定（1-60fps、デフォルト30fps）
- MP4動画生成・ダウンロード
- 生成進捗のプログレスバー表示
- プレビュー機能（アップロードした画像のサムネイル一覧）

### UI/UX Requirements
- shadcn/ui コンポーネントライブラリ使用
- ダーク/ライトテーマ切り替え（next-themes）
- 日本語/英語の言語切り替え（next-intl）
- レスポンシブデザイン

## Design Decisions

### 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **動画生成**: MediaBunny (v1.31.0+)
- **テーマ**: next-themes
- **i18n**: next-intl
- **言語**: TypeScript

### アーキテクチャ
```
src/
├── app/
│   ├── [locale]/           # 多言語ルーティング
│   │   ├── layout.tsx      # ローカライズレイアウト
│   │   └── page.tsx        # メインページ
│   ├── globals.css         # グローバルスタイル
│   └── layout.tsx          # ルートレイアウト
├── components/
│   ├── ui/                 # shadcn/ui コンポーネント
│   ├── image-uploader.tsx  # 画像アップロードコンポーネント
│   ├── fps-selector.tsx    # FPS選択コンポーネント
│   ├── video-generator.tsx # 動画生成コンポーネント
│   ├── progress-bar.tsx    # 進捗表示コンポーネント
│   ├── image-preview.tsx   # 画像プレビューコンポーネント
│   ├── theme-provider.tsx  # テーマプロバイダー
│   ├── mode-toggle.tsx     # テーマ切り替えボタン
│   └── locale-switcher.tsx # 言語切り替え
├── lib/
│   ├── video-encoder.ts    # MediaBunny動画エンコード処理
│   └── utils.ts            # ユーティリティ関数
├── i18n.ts                 # i18n設定
└── messages/
    ├── en.json             # 英語メッセージ
    └── ja.json             # 日本語メッセージ
```

### MediaBunny使用方法
```typescript
import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH } from 'mediabunny';

async function imagesToMp4(images: ImageBitmap[], fps: number): Promise<ArrayBuffer> {
  const width = images[0]?.width ?? 1920;
  const height = images[0]?.height ?? 1080;
  const frameDuration = 1 / fps;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
  });
  output.addVideoTrack(videoSource);
  await output.start();

  let timestamp = 0;
  for (const img of images) {
    ctx.drawImage(img, 0, 0);
    await videoSource.add(timestamp, frameDuration);
    timestamp += frameDuration;
  }

  await output.finalize();
  return output.target.buffer;
}
```

## Implementation Phases

### Phase 1: プロジェクト初期化とshadcn/ui設定
- [ ] Next.js 15プロジェクト作成（TypeScript + Tailwind CSS + App Router）
- [ ] shadcn/ui初期化と必要なコンポーネント追加（Button, Card, Slider, Progress, Select, DropdownMenu）
- [ ] next-themes設定とテーマプロバイダー実装
- [ ] グローバルCSSにダーク/ライトモード用CSS変数設定

### Phase 2: 多言語対応（i18n）設定
- [ ] next-intlインストールと設定
- [ ] ミドルウェア設定（/en, /ja ルーティング）
- [ ] 日本語・英語メッセージファイル作成
- [ ] [locale]動的ルート構造作成
- [ ] 言語切り替えコンポーネント実装

### Phase 3: 画像アップロード機能
- [ ] ドラッグ＆ドロップ対応の画像アップローダーコンポーネント
- [ ] ファイル選択ダイアログ対応
- [ ] 画像のソート機能（ファイル名順）
- [ ] アップロード画像のサムネイルプレビュー表示
- [ ] 画像の削除・並び替え機能

### Phase 4: FPS設定機能
- [ ] Sliderコンポーネントを使用したFPS設定UI
- [ ] 1-60fpsの範囲で設定可能
- [ ] デフォルト値30fps
- [ ] 数値入力での直接指定対応

### Phase 5: MediaBunny動画エンコード実装
- [ ] MediaBunnyライブラリのインストール
- [ ] video-encoder.ts でエンコード処理実装
- [ ] 画像のImageBitmap変換処理
- [ ] コーデックサポート確認（avc/hevc/vp9/av1）
- [ ] エラーハンドリング（WebCodecs未対応ブラウザ対応）

### Phase 6: 動画生成UIと進捗表示
- [ ] 生成ボタンとプログレスバー実装
- [ ] フレームごとの進捗更新表示
- [ ] 生成完了後のMP4ダウンロード機能
- [ ] 生成キャンセル機能

### Phase 7: UI/UXの仕上げ
- [ ] ヘッダーにテーマ切り替え・言語切り替えボタン配置
- [ ] レスポンシブデザイン調整
- [ ] アクセシビリティ対応（aria-label等）
- [ ] ローディング状態のUI
- [ ] エラー表示UI

## Risks and Mitigations

### リスク1: WebCodecs API未対応ブラウザ
- **対策**: ブラウザ検出を行い、未対応の場合は明確なエラーメッセージを表示
- **対応ブラウザ**: Chrome 94+, Firefox 111+, Safari 16.4+

### リスク2: 大量画像のメモリ使用量
- **対策**: ImageBitmapをストリーミング処理、不要なビットマップは即座に解放

### リスク3: 画像サイズの不統一
- **対策**: 最初の画像サイズを基準にキャンバスを作成、他の画像はリサイズして描画

## Dependencies

### npm packages
```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "mediabunny": "^1.31.0",
    "next-themes": "^0.4.x",
    "next-intl": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.7.x",
    "tailwindcss": "^3.4.x",
    "@types/react": "^19.x",
    "@types/node": "^22.x"
  }
}
```

### shadcn/ui components
- Button
- Card
- Slider
- Progress
- Select
- DropdownMenu
- Input
- Label
- Separator

## Additional Notes

### UI設計
- シンプルで直感的なシングルページアプリケーション
- 3ステップの明確なワークフロー：1. 画像アップロード → 2. FPS設定 → 3. 動画生成

### メッセージ例（ja.json）
```json
{
  "title": "Image to MP4 Converter",
  "upload": {
    "title": "画像をアップロード",
    "dropzone": "ここに画像をドラッグ＆ドロップ、またはクリックして選択",
    "supported": "対応形式: PNG, JPG, WebP"
  },
  "fps": {
    "title": "FPS設定",
    "label": "フレームレート"
  },
  "generate": {
    "button": "動画を生成",
    "progress": "生成中...",
    "download": "ダウンロード"
  },
  "theme": {
    "light": "ライトモード",
    "dark": "ダークモード",
    "system": "システム設定"
  }
}
```
