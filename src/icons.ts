/**
 * ステージメッセージ用のSVGアイコン (Feather Icons由来のパス)。
 * 絵文字は環境によって見た目が変わるため、静的なものは index.html に、
 * JSから差し替えるものはここに定義する。
 */
const svg = (paths: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  /** カメラ (起動中) */
  camera: svg(
    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
      '<circle cx="12" cy="13" r="4"/>',
  ),
  /** カメラ利用不可 (エラー) */
  cameraOff: svg(
    '<line x1="1" y1="1" x2="23" y2="23"/>' +
      '<path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>',
  ),
  /** 警告 (非対応環境) */
  alert: svg(
    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
      '<line x1="12" y1="9" x2="12" y2="13"/>' +
      '<line x1="12" y1="17" x2="12.01" y2="17"/>',
  ),
} as const;
