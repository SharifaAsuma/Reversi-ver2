// ESLint(コードの静的解析・品質チェックツール)の設定ファイル
// Flat Config形式(ESLint v9以降の新しい設定方式)で記述されている
// TypeScript版にあった typescript-eslint の設定は不要になったため削除している

import js from '@eslint/js'; // JavaScriptの基本的な推奨ルール
import globals from 'globals'; // ブラウザ/Node.jsなど環境ごとのグローバル変数定義
import reactHooks from 'eslint-plugin-react-hooks'; // Reactのフック(useState等)の使い方をチェックするプラグイン
import reactRefresh from 'eslint-plugin-react-refresh'; // ViteのReact Fast Refresh(HMR)との相性をチェックするプラグイン

export default [
  // distフォルダ(ビルド成果物)はチェック対象から除外する
  { ignores: ['dist'] },
  {
    // JavaScriptの基本推奨ルールを適用
    ...js.configs.recommended,
    // このルール設定を適用するファイルの拡張子
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      // 対応するECMAScriptのバージョン
      ecmaVersion: 2020,
      // import/export構文(ESモジュール)を使うことを明示
      sourceType: 'module',
      // ブラウザ環境で使えるグローバル変数(window, documentなど)を許可
      globals: globals.browser,
      parserOptions: {
        // JSX構文を解析できるようにする設定
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // react-hooksプラグインの推奨ルール(depsの書き忘れ検知など)を適用
      ...reactHooks.configs.recommended.rules,
      // Fast Refresh(ホットリロード)が壊れないよう、
      // コンポーネント以外のエクスポートがある場合に警告を出す
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];
