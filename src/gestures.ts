/**
 * オーバーレイ画像の変形状態。
 * x, y はステージ中心からのオフセット (ステージのCSSピクセル単位)。
 * 変形は「移動 → 回転 → 拡大縮小」の順で、画像中心を基準に適用する。
 */
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number; // ラジアン
}

export function identityTransform(): Transform {
  return { x: 0, y: 0, scale: 1, rotation: 0 };
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;

function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

interface Point {
  x: number;
  y: number;
}

/**
 * ステージ要素にドラッグ / ピンチ (拡大縮小・回転) / ホイール操作を取り付ける。
 * 座標はすべてステージ中心を原点として扱う。
 */
export function attachGestures(
  el: HTMLElement,
  getTransform: () => Transform,
  onChange: (t: Transform) => void,
): void {
  const pointers = new Map<number, Point>();

  const toLocal = (e: PointerEvent | WheelEvent): Point => {
    const r = el.getBoundingClientRect();
    return {
      x: e.clientX - r.left - r.width / 2,
      y: e.clientY - r.top - r.height / 2,
    };
  };

  el.addEventListener("pointerdown", (e) => {
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // キャプチャできなくても操作自体は継続できる
    }
    pointers.set(e.pointerId, toLocal(e));
  });

  el.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const now = toLocal(e);
    const t = { ...getTransform() };

    if (pointers.size === 1) {
      t.x += now.x - prev.x;
      t.y += now.y - prev.y;
      pointers.set(e.pointerId, now);
      onChange(t);
      return;
    }

    // 2本指: もう一方の指は動いていないものとして、今回のイベント分だけ差分を適用する
    const others = [...pointers.entries()].filter(([id]) => id !== e.pointerId);
    const anchor = others[0][1];

    const cPrev = { x: (prev.x + anchor.x) / 2, y: (prev.y + anchor.y) / 2 };
    const cNow = { x: (now.x + anchor.x) / 2, y: (now.y + anchor.y) / 2 };
    const dPrev = Math.hypot(prev.x - anchor.x, prev.y - anchor.y);
    const dNow = Math.hypot(now.x - anchor.x, now.y - anchor.y);
    const aPrev = Math.atan2(prev.y - anchor.y, prev.x - anchor.x);
    const aNow = Math.atan2(now.y - anchor.y, now.x - anchor.x);

    const k = dPrev > 0 ? dNow / dPrev : 1;
    const dTheta = aNow - aPrev;

    const newScale = clampScale(t.scale * k);
    const effectiveK = newScale / t.scale;

    // 画像中心をピンチの中心(セントロイド)基準で回転・拡大する
    const vx = t.x - cPrev.x;
    const vy = t.y - cPrev.y;
    const cos = Math.cos(dTheta);
    const sin = Math.sin(dTheta);
    t.x = cNow.x + effectiveK * (vx * cos - vy * sin);
    t.y = cNow.y + effectiveK * (vx * sin + vy * cos);
    t.rotation += dTheta;
    t.scale = newScale;

    pointers.set(e.pointerId, now);
    onChange(t);
  });

  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  // PC向け: ホイールで拡大縮小、Shift+ホイールで回転
  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const t = { ...getTransform() };
      if (e.shiftKey) {
        t.rotation += (e.deltaY > 0 ? 1 : -1) * (Math.PI / 36); // 5度ずつ
      } else {
        t.scale = clampScale(t.scale * (e.deltaY > 0 ? 0.92 : 1.08));
      }
      onChange(t);
    },
    { passive: false },
  );
}
