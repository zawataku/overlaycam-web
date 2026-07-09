import type { Transform } from "./gestures";

export interface OverlayState {
  img: HTMLImageElement;
  transform: Transform;
}

/** プレビューでのオーバーレイ基準幅 (ステージ幅に対する比率)。CSSの width: 60% と一致させること */
export const OVERLAY_BASE_WIDTH_RATIO = 0.6;

const STAGE_ASPECT = 3 / 4;

/**
 * カメラ映像とオーバーレイをプレビューの見た目どおりに合成する。
 * キャンバスは動画のネイティブ解像度を 3:4 に中央クロップしたサイズ
 * (object-fit: cover と同じ切り取り) なので、プレビューより高解像度になる。
 *
 * @param stageWidth ステージのCSSピクセル幅。オーバーレイの座標系を実解像度へ換算するのに使う
 */
export function composite(
  video: HTMLVideoElement,
  mirrored: boolean,
  overlay: OverlayState | null,
  stageWidth: number,
): HTMLCanvasElement {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw === 0 || vh === 0) {
    throw new Error("カメラ映像がまだ準備できていません");
  }

  // 3:4 に中央クロップ
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  if (vw / vh > STAGE_ASPECT) {
    sw = Math.round(vh * STAGE_ASPECT);
    sx = Math.round((vw - sw) / 2);
  } else {
    sh = Math.round(vw / STAGE_ASPECT);
    sy = Math.round((vh - sh) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvasの初期化に失敗しました");

  ctx.save();
  if (mirrored) {
    ctx.translate(sw, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.restore();

  if (overlay) {
    const f = sw / stageWidth; // プレビューpx → 実解像度px の換算係数
    const t = overlay.transform;
    const baseW = sw * OVERLAY_BASE_WIDTH_RATIO;
    const baseH = (baseW * overlay.img.naturalHeight) / overlay.img.naturalWidth;

    ctx.save();
    ctx.translate(sw / 2 + t.x * f, sh / 2 + t.y * f);
    ctx.rotate(t.rotation);
    ctx.scale(t.scale, t.scale);
    ctx.drawImage(overlay.img, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();
  }

  return canvas;
}
