# ベースイメージとして公式のNode.jsイメージを使用
FROM node:18

# アプリケーションディレクトリを作成
WORKDIR /usr/src/app

# 環境変数を設定
ENV PORT 8080
ENV HOST 0.0.0.0

# パッケージ定義ファイルをコピーして、依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# TypeScript をコンパイル
RUN npm run build

# アプリケーションを起動
CMD ["node", "dist/index.js"]