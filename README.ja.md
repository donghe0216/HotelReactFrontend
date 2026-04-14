# ホテル予約システム — フロントエンド

[![E2E Tests](https://github.com/donghe0216/HotelReactFrontend/actions/workflows/e2e.yml/badge.svg)](https://github.com/donghe0216/HotelReactFrontend/actions/workflows/e2e.yml)

QAポートフォリオ用のフルスタックホテル予約システムです。  
E2Eテスト自動化・CI/CD・クラウドデプロイを一気通貫で実装しています。  
**E2Eテスト 53件・5スペックファイル・8 Page Objectクラス**を実装しています。

**ライブデモ：** https://d1sr0fmxk50vjd.cloudfront.net/home  
**バックエンドリポジトリ：** https://github.com/donghe0216/HotelJavaBackend  

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| UI | React 19、React Router 7 |
| HTTP | Axios |
| E2Eテスト | Playwright |
| CI/CD | GitHub Actions |
| ホスティング | AWS S3 + CloudFront |

---

## テスト設計のポイント

### Page Object Model（POM）パターン
全セレクターを `tests/pages/` に集約。テストコードにセレクターを直書きせず、保守性を確保しています。

### なぜE2Eテストが必要か
APIテストではHTTPレイヤーまでしか検証できず、「ボタンをクリックする→APIが呼ばれる→レスポンスがUIに反映される」という一連のUIフローは保証できません。E2EテストはUI〜バックエンド間の統合フローを実際のブラウザで検証します。

### 認証状態の分離
3つのPlaywrightプロジェクトで認証状態を管理：

| プロジェクト | 認証状態 |
|------------|---------|
| `chromium-public` | 未ログイン（匿名） |
| `chromium` | カスタマーログイン済み |
| `chromium-admin` | 管理者ログイン済み |

### テストカバレッジ

| スペックファイル | テストケース | スコープ |
|---------------|------------|---------|
| `tests/auth/auth.spec.js` | TC-AUTH-01–08 | ログイン・登録フォームバリデーション |
| `tests/rooms/all-rooms.spec.js` | TC-AR-01–13 | 部屋一覧・検索・フィルター・日付選択 |
| `tests/rooms/room-details.spec.js` | TC-RD-01–09 | 部屋詳細・予約フロー |
| `tests/profile/profile.spec.js` | TC-PRO-01–09、TC-EDIT-01–05 | プロフィール・予約キャンセル |
| `tests/booking/find-booking.spec.js` | TC-FB-01–08 | 予約番号による照会 |

---

## バグレポート

### 修正済み

開発・テスト中に発見し、修正したバグです。

| ID | 場所 | 内容 | 深刻度 | 発見方法 |
|----|------|------|--------|---------|
| BUG-F-01 | FindBookingPage | 無効な予約番号を入力しても何も反応しない — CloudFrontがAPI 404の代わりにHTMLを返し、`response.booking` がundefinedになるがnullチェックなし | Medium | 手動テスト |
| BUG-F-02 | ProfilePage | キャンセルボタンが午前9時以降に消える — `new Date("2026-04-14")` がUTC真夜中（＝JST午前9時）として解析され、当日のチェックインが過去扱いになる | Medium | 手動テスト |
| BUG-F-03 | RoomDetailsPage | カレンダーで選択した日付がハイライトされない — react-day-picker v9で `onDayClick` が廃止され、`mode="single"` + `onSelect` が必要になった | Low | 手動テスト |
| BUG-F-04 | ProfilePage | 部屋が削除済みの場合にクラッシュ — `booking.room.roomNumber` をnullチェックなしで参照 | High | 手動テスト |
| BUG-F-05 | EditBookingPage | 部屋またはユーザーが削除済みの場合にクラッシュ — `bookingDetails.room.type` と `bookingDetails.user.firstName` をnullチェックなしで参照 | High | 手動テスト |
| BUG-F-06 | EditBookingPage | 「First Name」ラベルが `lastName` フィールドの値を表示していた | Low | コードレビュー |
| BUG-B-01 | POST `/bookings/{id}/cancel` | キャンセルエンドポイントが未実装 — フロントエンドのキャンセルボタンが404を返しエラー表示もなくサイレントに失敗 | High | E2E TC-PRO-08 |

### 既知（保留中）

ポートフォリオ素材として意図的に残しているバグです。それぞれ異なる種類の欠陥を示しています。

| ID | 場所 | 内容 | 深刻度 | 発見方法 |
|----|------|------|--------|---------|
| BUG-K-01 | プロフィール編集ページ | 入力フィールドが表示されず、実際に編集できない | Medium | E2E TC-EDIT-02 |
| BUG-K-02 | アカウント削除フロー | 削除後に `/signup`（存在しないルート）へリダイレクト（正しくは `/register`） | Low | E2E TC-EDIT-05 |
| BUG-K-03 | 予約照会ページ | 見出しに "Booker Detials" というタイポ | Low | 手動テスト |


---

<details>
<summary>ローカル環境セットアップ</summary>

**前提条件：**
- Node.js 20以上
- npm 9以上
- バックエンドが `localhost:9090` で起動済み（シードデータ投入済み → [バックエンドREADME](https://github.com/donghe0216/HotelJavaBackend) 参照）

```bash
# 1. リポジトリをクローン
git clone https://github.com/donghe0216/HotelReactFrontend.git
cd HotelReactFrontend

# 2. 依存パッケージをインストール
npm ci

# 3. 起動
npm start
```

### E2Eテストの実行

```bash
# Playwrightブラウザをインストール（初回のみ）
npx playwright install chromium --with-deps

# 認証状態ファイルを生成（初回・認証情報変更時）
npx playwright test --project=setup

# 全テスト実行（バックエンド + MySQL が必要）
npx playwright test

# 認証ロール別に実行
npx playwright test --project=chromium          # カスタマー
npx playwright test --project=chromium-public   # 匿名
npx playwright test --project=chromium-admin    # 管理者

# 特定スペックのみ
npx playwright test tests/rooms/all-rooms.spec.js

# HTMLレポートの表示
npx playwright show-report
```

</details>

---

## ディレクトリ構成

```
src/
  component/         # Reactコンポーネント
  service/           # ApiService（Axiosラッパー）
tests/
  pages/             # Page Objectクラス
  rooms/             # 部屋関連スペック
  profile/           # プロフィールスペック
  booking/           # 予約スペック
  .auth/             # 認証状態ファイル（gitignore済み）
```
