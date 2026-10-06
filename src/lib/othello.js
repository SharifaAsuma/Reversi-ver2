// リバーシ(オセロ)の盤面ロジック。
// 盤面は8x8の2次元配列で表現する。 0=空, 1=黒, 2=白。
// (もとはTypeScript(othello.ts)で書かれ、型情報(Board/Player型など)を
//  持っていた想定だが、ここでは同じ考え方で素のJavaScriptとして実装している)

const SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 8方向(上下左右+斜め)を表す差分ベクトル
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

// 盤面の範囲内かどうか
function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

// ゲーム開始時の初期盤面(中央に石4つ)を作る
export function createInitialBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
}

// (row, col) に player が石を置いたと仮定した場合に、
// 裏返ることになる相手石の座標一覧を返す。置けない場合は空配列。
export function getFlips(board, row, col, player) {
  const flips = [];
  if (!inBounds(row, col) || board[row][col] !== EMPTY) {
    return flips;
  }
  const opponent = player === BLACK ? WHITE : BLACK;

  for (const [dr, dc] of DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const lineFlips = [];

    // その方向に相手の石が連続している間は候補として記録していく
    while (inBounds(r, c) && board[r][c] === opponent) {
      lineFlips.push([r, c]);
      r += dr;
      c += dc;
    }
    // 相手石の列の先に自分の石があれば、その間の相手石は全部裏返せる
    if (lineFlips.length > 0 && inBounds(r, c) && board[r][c] === player) {
      flips.push(...lineFlips);
    }
  }
  return flips;
}

// (row, col) に player が置けるかどうか(1つ以上裏返せるか)
export function isValidMove(board, row, col, player) {
  return getFlips(board, row, col, player).length > 0;
}

// player が置ける全マスの一覧を返す
export function getValidMoves(board, player) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isValidMove(board, r, c, player)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

// (row, col) に player が石を置いた後の新しい盤面を返す。
// 置けない手だった場合は null を返す。元の盤面は変更せずコピーを返す。
export function applyMove(board, row, col, player) {
  const flips = getFlips(board, row, col, player);
  if (flips.length === 0) {
    return null;
  }
  const newBoard = board.map((row) => row.slice());
  newBoard[row][col] = player;
  for (const [r, c] of flips) {
    newBoard[r][c] = player;
  }
  return newBoard;
}

// 盤面上の黒石・白石の数を数える
export function countDiscs(board) {
  let black = 0;
  let white = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
}

// AI用: player が置ける有効な手の中からランダムに1つ選ぶ。無ければ null
export function pickRandomMove(board, player) {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}
