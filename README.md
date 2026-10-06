# リバーシ (Reversi) — JavaScript版 ver2

React + JavaScript(TypeScriptなし) + Tailwind CSS で作られたリバーシアプリ。
もとはTypeScriptで書かれていたものを、型情報を取り除いてJavaScriptに書き換えました。

## TypeScript版との違い

- `.tsx` / `.ts` ファイル → `.jsx` / `.js` に変更
- `type GameMode = ...` のような型定義、`useState<Board>()` のような型注釈(ジェネリクス)をすべて削除
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` / `vite-env.d.ts` は不要になったため削除
- `package.json` から `typescript` / `@types/react` / `@types/react-dom` を削除し、`typecheck` スクリプトも削除
- `eslint.config.js` から TypeScript用の設定(`typescript-eslint`)を削除し、素のJavaScript向けの設定に変更
- ゲームロジック本体(`src/lib/othello.js`)は、盤面判定・裏返し処理・勝敗判定・AIの手選びを
  同じアルゴリズムのままJavaScriptで実装し直したもの

## 起動方法

```bash
npm install
npm run dev
```

`http://localhost:5173` をブラウザで開くとゲーム画面が表示されます。
