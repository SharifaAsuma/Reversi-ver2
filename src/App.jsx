import { useState, useEffect, useCallback, useRef } from "react";
import {
  createInitialBoard, // 初期盤面(8x8、中央に石4つ)を作る関数
  applyMove, // 指定マスに石を置き、盤面を更新する関数(裏返し処理込み)
  getValidMoves, // 現在のプレイヤーが置ける有効なマスの一覧を取得する関数
  getFlips, // 指定マスに置いた場合に裏返る石の座標一覧を取得する関数
  countDiscs, // 盤面上の黒石・白石の数を数える関数
  pickRandomMove, // AI用: 有効な手からランダムに1手を選ぶ関数
} from "./lib/othello";
import { Disc, RotateCcw, Cpu, User, Trophy } from "lucide-react"; // アイコンコンポーネント群

// TypeScript版にあった type GameMode / type GameStatus / type Board / type Player は
// 型定義であり、JavaScriptには存在しないため削除している。
// 値そのものの扱い(文字列 "pvp"/"cpu"、数値 1/2 など)は元のロジックと同じ。

// オセロ(リバーシ)アプリのメインコンポーネント
export default function App() {
  // 盤面の状態(8x8の2次元配列。0=空, 1=黒, 2=白)
  const [board, setBoard] = useState(createInitialBoard);
  // 現在の手番プレイヤー(1=黒 or 2=白)
  const [currentPlayer, setCurrentPlayer] = useState(1);
  // 現在の対戦モード("pvp"=対人戦 / "cpu"=COM戦。デフォルトはCOM戦)
  const [mode, setMode] = useState("cpu");
  // ゲームの進行状態("playing"=対戦中 / "gameover"=終了)
  const [status, setStatus] = useState("playing");
  // AIが着手を考えている最中かどうか(この間はクリック操作を無効化する)
  const [aiThinking, setAiThinking] = useState(false);
  // 「パスしました」等のお知らせメッセージ(なければnull)
  const [passNotice, setPassNotice] = useState(null);
  // 直前に置かれた石の座標(ハイライト表示用)。[行, 列] の配列、または null
  const [lastMove, setLastMove] = useState(null);
  // 現在アニメーション中(裏返り中)のマスの集合("行-列"形式の文字列で管理)
  const [flipAnim, setFlipAnim] = useState(new Set());
  // アニメーション解除用のタイマーIDを保持(連続クリック時に前のタイマーを消すため)
  const animTimeout = useRef(null);

  // 現在のプレイヤーが置ける有効なマスの一覧を毎レンダリングごとに計算
  const validMoves = getValidMoves(board, currentPlayer);
  // 有効マスを高速に判定できるよう "行-列" 文字列のSetに変換
  const validSet = new Set(validMoves.map(([r, c]) => `${r}-${c}`));
  // 現在の黒石・白石の数({ black: n, white: n } の形で返ってくる)
  const counts = countDiscs(board);

  // マス目がクリックされたときの処理
  const handleCellClick = useCallback(
    (row, col) => {
      // ゲーム終了時やAI思考中はクリックを無視する
      if (status === "gameover" || aiThinking) return;
      // COM戦で白(AI)の手番のときはプレイヤーの操作を無視する
      if (mode === "cpu" && currentPlayer === 2) return; // AI's turn

      // アニメーション表示用に、このクリックで裏返るマスを事前取得
      const flips = getFlipsForAnim(board, row, col, currentPlayer);
      // 実際に石を置いた後の新しい盤面を計算(置けない場所ならnullが返る)
      const newBoard = applyMove(board, row, col, currentPlayer);
      if (!newBoard) return;

      setBoard(newBoard); // 盤面を更新
      setLastMove([row, col]); // 最後に置いた場所を記録
      triggerFlipAnim(flips); // 裏返りアニメーションを開始
      setPassNotice(null); // パス通知をクリア
      advanceTurn(newBoard, currentPlayer); // 手番を次に進める(パス・終了判定込み)
    },
    [board, currentPlayer, mode, status, aiThinking]
  );

  // 手番を次のプレイヤーに進める処理
  // ・次のプレイヤーが打てる手があればその人の番にする
  // ・次のプレイヤーが打てる手がなく、今のプレイヤーがまだ打てるならパスさせて手番継続
  // ・どちらも打てない場合はゲーム終了にする
  function advanceTurn(newBoard, fromPlayer) {
    const next = fromPlayer === 1 ? 2 : 1;
    const nextMoves = getValidMoves(newBoard, next);

    if (nextMoves.length > 0) {
      setCurrentPlayer(next);
      return;
    }

    // next player must pass
    // 次の手番の人が置ける場所がない場合、今の手番の人がまだ置けるかを確認
    const sameMoves = getValidMoves(newBoard, fromPlayer);
    if (sameMoves.length > 0) {
      setPassNotice(
        next === 1 ? "黒は打てる手がないためパスします" : "白は打てる手がないためパスします"
      );
      // current player keeps going
      // 手番は変えず、今のプレイヤーが続けて打てるようにする
      return;
    }

    // both can't move -> game over
    // 両者とも置けない場合はゲーム終了
    setStatus("gameover");
  }

  // AI move
  // AI(白)の手番になったら自動的に手を選んで打つ処理
  useEffect(() => {
    // プレイ中でCOM戦、かつ白(AI)の手番のときだけ動作する
    if (status !== "playing" || mode !== "cpu" || currentPlayer !== 2) return;
    setAiThinking(true); // 「AIが考え中」の表示を出す
    // 少し「考えている」ように見せるため0.7秒待ってから着手する
    const timer = window.setTimeout(() => {
      // 有効な手の中からランダムに1手選ぶ(簡易AI)
      const move = pickRandomMove(board, 2);
      if (move) {
        const [row, col] = move;
        const flips = getFlipsForAnim(board, row, col, 2);
        const newBoard = applyMove(board, row, col, 2);
        if (newBoard) {
          setBoard(newBoard);
          setLastMove([row, col]);
          triggerFlipAnim(flips);
          setPassNotice(null);
          advanceTurn(newBoard, 2);
        }
      } else {
        // AI has no moves, pass back to player
        // AI(白)が置ける手がない場合、プレイヤー(黒)に打てる手があるか確認
        const playerMoves = getValidMoves(board, 1);
        if (playerMoves.length > 0) {
          setPassNotice("白は打てる手がないためパスします");
          setCurrentPlayer(1); // 黒の手番に戻す
        } else {
          setStatus("gameover"); // 両者とも打てないので終了
        }
      }
      setAiThinking(false); // 「考え中」表示を解除
    }, 700);
    // コンポーネントの再レンダリングやアンマウント時に前のタイマーを解除(二重発火防止)
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, mode, status, board]);

  // 裏返るマスに一時的なアニメーション用クラスを付与し、
  // 一定時間後(0.5秒後)に元に戻す処理
  function triggerFlipAnim(cells) {
    // 前回のアニメーション解除タイマーが残っていればキャンセル
    if (animTimeout.current) window.clearTimeout(animTimeout.current);
    // 今回裏返るマスの集合をセットしてアニメーションを開始
    setFlipAnim(new Set(cells.map(([r, c]) => `${r}-${c}`)));
    // 0.5秒後にアニメーション状態をクリア
    animTimeout.current = window.setTimeout(() => setFlipAnim(new Set()), 500);
  }

  // ゲームを最初の状態にリセットする処理
  // newModeを指定しなければ現在のモードを維持したままリセットする
  function resetGame(newMode = mode) {
    setBoard(createInitialBoard());
    setCurrentPlayer(1); // 黒から開始
    setStatus("playing");
    setAiThinking(false);
    setPassNotice(null);
    setLastMove(null);
    setFlipAnim(new Set());
    setMode(newMode);
  }

  // ゲーム終了時の勝敗判定(黒石・白石の数を比較)
  // 1=黒の勝ち, 2=白の勝ち, 0=引き分け, null=ゲーム未終了
  const winner = (() => {
    if (status !== "gameover") return null;
    if (counts.black > counts.white) return 1;
    if (counts.white > counts.black) return 2;
    return 0;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        {/* タイトル部分 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            オセロ
          </h1>
          <p className="text-emerald-300/70 text-sm mt-1">Reversi</p>
        </div>

        {/* Mode toggle */}
        {/* 対人戦 / COM戦 の切り替えボタン。押すとその場でゲームがリセットされる */}
        <div className="flex justify-center gap-2 mb-5">
          <button
            onClick={() => resetGame("pvp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "pvp"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <User size={16} />
            対人戦
          </button>
          <button
            onClick={() => resetGame("cpu")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "cpu"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <Cpu size={16} />
            COM戦
          </button>
        </div>

        {/* Score bar */}
        {/* 黒・白それぞれの石数と、現在の手番/状況メッセージを表示するバー */}
        <div className="flex items-center justify-between mb-4 px-2">
          <ScoreCard
            label="黒"
            count={counts.black}
            active={currentPlayer === 1 && status === "playing"}
            color="bg-slate-900 border-slate-100/20"
          />
          <div className="text-center">
            {status === "playing" ? (
              <div className="text-white/80 text-sm font-medium">
                {aiThinking ? (
                  // AIが着手を計算している間の表示
                  <span className="flex items-center gap-1.5 justify-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                    AIが考え中...
                  </span>
                ) : passNotice ? (
                  // パスが発生した場合の通知表示
                  <span className="text-amber-300">{passNotice}</span>
                ) : (
                  // 通常時: 現在の手番を表示
                  <span>
                    {currentPlayer === 1 ? "黒" : "白"}のターン
                  </span>
                )}
              </div>
            ) : (
              // ゲーム終了後の表示
              <div className="text-white/60 text-sm">ゲーム終了</div>
            )}
          </div>
          <ScoreCard
            label="白"
            count={counts.white}
            active={currentPlayer === 2 && status === "playing"}
            color="bg-white border-slate-900/10"
          />
        </div>

        {/* Board */}
        {/* 8x8のオセロ盤本体 */}
        <div className="relative">
          <div className="bg-emerald-700 rounded-2xl p-2 sm:p-3 shadow-2xl shadow-emerald-900/50">
            <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  // このマスが今クリック可能かどうか
                  // (有効な手であり、かつプレイ中、AI思考中でなく、AIの手番でもないこと)
                  const isValid = validSet.has(key) && status === "playing" && !aiThinking && !(mode === "cpu" && currentPlayer === 2);
                  // 直前に置かれたマスかどうか(ハイライト表示用)
                  const isLast = lastMove && lastMove[0] === r && lastMove[1] === c;
                  // このマスが現在裏返りアニメーション中かどうか
                  const isFlipping = flipAnim.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => handleCellClick(r, c)}
                      disabled={!isValid}
                      className={`relative aspect-square rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 ${
                        isValid
                          ? "bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
                          : "bg-emerald-800/80"
                      }`}
                    >
                      {/* Valid move hint */}
                      {/* 石が置ける空きマスに、薄い丸印でヒントを表示 */}
                      {isValid && cell === 0 && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-1/3 h-1/3 rounded-full bg-white/20 group-hover:bg-white/30" />
                        </span>
                      )}
                      {/* Last move indicator */}
                      {/* 直前に置かれた石の周りに枠線を表示 */}
                      {isLast && cell !== 0 && (
                        <span className="absolute inset-1 rounded-md ring-2 ring-amber-400/70 pointer-events-none" />
                      )}
                      {/* Disc */}
                      {/* 石本体(黒 or 白)の描画。裏返りアニメーション中は回転アニメを付与 */}
                      {cell !== 0 && (
                        <span
                          className={`block w-[78%] h-[78%] rounded-full transition-transform duration-500 ${
                            cell === 1
                              ? "bg-gradient-to-br from-slate-700 to-slate-950 shadow-lg shadow-black/40"
                              : "bg-gradient-to-br from-slate-100 to-slate-300 shadow-lg shadow-black/20"
                          } ${isFlipping ? "animate-[flip_0.5s_ease-in-out]" : ""}`}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Game over overlay */}
          {/* ゲーム終了時に盤面の上に半透明で結果表示を重ねる */}
          {status === "gameover" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
              <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl border border-white/10 max-w-xs">
                <Trophy className="mx-auto mb-3 text-amber-400" size={40} />
                <p className="text-white text-lg font-bold mb-1">
                  {winner === 0
                    ? "引き分け"
                    : winner === 1
                    ? "黒の勝ち"
                    : "白の勝ち"}
                </p>
                <p className="text-white/60 text-sm mb-4">
                  黒 {counts.black} - {counts.white} 白
                </p>
                <button
                  onClick={() => resetGame()}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
                >
                  <RotateCcw size={16} />
                  もう一度
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        {/* 盤面下部の「リセット」ボタン(モードはそのままで最初からやり直す) */}
        <div className="flex justify-center mt-5">
          <button
            onClick={() => resetGame()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            <RotateCcw size={16} />
            リセット
          </button>
        </div>

        {/* Footer hint */}
        {/* モードに応じた補足説明テキスト */}
        <p className="text-center text-white/40 text-xs mt-4">
          {mode === "cpu"
            ? "AIは有効な手からランダムに選びます"
            : "2人で対戦するモードです"}
        </p>
      </div>
    </div>
  );
}

// 黒/白それぞれのスコア(石の数)を表示するカード型の小コンポーネント
// active=true のとき(自分の手番のとき)は枠線と拡大表示で強調する
// TypeScript版では props の型を { label: string; count: number; ... } のように
// 注釈していたが、JavaScriptでは型注釈を書かずに分割代入するだけでよい
function ScoreCard({ label, count, active, color }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color} ${
        active ? "ring-2 ring-emerald-400 scale-105" : ""
      } transition-all`}
    >
      <Disc size={20} className={label === "黒" ? "text-white/90" : "text-slate-900/90"} />
      <div className="text-left">
        <div className={`text-xs ${label === "黒" ? "text-white/60" : "text-slate-900/60"}`}>
          {label}
        </div>
        <div className={`text-xl font-bold ${label === "黒" ? "text-white" : "text-slate-900"}`}>
          {count}
        </div>
      </div>
    </div>
  );
}

// Helper to get flipping cells for animation
// 指定マスに石を置いた場合に裏返る石の座標一覧を取得するヘルパー関数
// (アニメーション対象マスを求めるためだけに getFlips をラップしている)
function getFlipsForAnim(board, row, col, player) {
  return getFlips(board, row, col, player);
}
