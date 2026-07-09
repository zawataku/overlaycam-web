import "./style.css";
import {
  startCamera,
  stopCamera,
  hasMultipleCameras,
  cameraErrorMessage,
  type FacingMode,
} from "./camera";
import {
  attachGestures,
  identityTransform,
  type Transform,
} from "./gestures";
import { composite } from "./composite";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const video = $<HTMLVideoElement>("video");
const stage = $<HTMLDivElement>("stage");
const overlayLayer = $<HTMLDivElement>("overlay-layer");
const overlayImg = $<HTMLImageElement>("overlay-img");
const overlayTools = $<HTMLDivElement>("overlay-tools");
const flash = $<HTMLDivElement>("flash");
const stageMessage = $<HTMLDivElement>("stage-message");
const stageMessageIcon = $<HTMLDivElement>("stage-message-icon");
const stageMessageText = $<HTMLParagraphElement>("stage-message-text");
const retryBtn = $<HTMLButtonElement>("retry-btn");
const hint = $<HTMLParagraphElement>("hint");
const pickBtn = $<HTMLButtonElement>("pick-btn");
const shutterBtn = $<HTMLButtonElement>("shutter-btn");
const flipBtn = $<HTMLButtonElement>("flip-btn");
const flipSpacer = $<HTMLSpanElement>("flip-spacer");
const resetOverlayBtn = $<HTMLButtonElement>("reset-overlay-btn");
const removeOverlayBtn = $<HTMLButtonElement>("remove-overlay-btn");
const fileInput = $<HTMLInputElement>("file-input");
const result = $<HTMLDivElement>("result");
const resultImg = $<HTMLImageElement>("result-img");
const saveBtn = $<HTMLButtonElement>("save-btn");
const shareBtn = $<HTMLButtonElement>("share-btn");
const closeResultBtn = $<HTMLButtonElement>("close-result-btn");

// ---- 状態 ----
let stream: MediaStream | null = null;
let facingMode: FacingMode = "environment";
let hasOverlay = false;
let transform: Transform = identityTransform();
let isCapturing = false;
let overlayUrl: string | null = null;
let resultUrl: string | null = null;
let resultBlob: Blob | null = null;

// ---- カメラ ----

async function initCamera(): Promise<void> {
  shutterBtn.disabled = true;
  video.classList.remove("active");
  stageMessage.hidden = false;
  stageMessageIcon.textContent = "📷";
  stageMessageText.textContent = "カメラを起動しています…";
  retryBtn.hidden = true;

  if (!navigator.mediaDevices?.getUserMedia) {
    stageMessageIcon.textContent = "⚠️";
    stageMessageText.textContent =
      "このブラウザではカメラを利用できません。\nHTTPSでアクセスしているか確認してください。";
    return;
  }

  stopCamera(stream);
  stream = null;

  try {
    stream = await startCamera(video, facingMode);
    video.classList.add("active");
    video.classList.toggle("mirrored", facingMode === "user");
    stageMessage.hidden = true;
    shutterBtn.disabled = false;

    // 権限取得後でないとデバイス一覧が取れないブラウザがあるため、ここで判定する
    if (await hasMultipleCameras()) {
      flipBtn.hidden = false;
      flipSpacer.classList.add("collapsed");
    }
  } catch (err) {
    console.error("カメラの初期化エラー:", err);
    stageMessageIcon.textContent = "🚫";
    stageMessageText.textContent = cameraErrorMessage(err);
    retryBtn.hidden = false;
  }
}

retryBtn.addEventListener("click", () => void initCamera());

flipBtn.addEventListener("click", () => {
  facingMode = facingMode === "environment" ? "user" : "environment";
  void initCamera();
});

// ---- オーバーレイ画像 ----

pickBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (overlayUrl) URL.revokeObjectURL(overlayUrl);
  overlayUrl = URL.createObjectURL(file);
  overlayImg.src = overlayUrl;
  fileInput.value = "";
});

overlayImg.addEventListener("load", () => {
  hasOverlay = true;
  transform = identityTransform();
  applyTransform();
  overlayLayer.hidden = false;
  overlayTools.hidden = false;
  hint.classList.add("visible");
});

function applyTransform(): void {
  const t = transform;
  overlayImg.style.transform =
    `translate(calc(-50% + ${t.x}px), calc(-50% + ${t.y}px)) ` +
    `rotate(${t.rotation}rad) scale(${t.scale})`;
}

attachGestures(
  overlayLayer,
  () => transform,
  (t) => {
    transform = t;
    applyTransform();
  },
);

resetOverlayBtn.addEventListener("click", () => {
  transform = identityTransform();
  applyTransform();
});

removeOverlayBtn.addEventListener("click", () => {
  hasOverlay = false;
  overlayLayer.hidden = true;
  overlayTools.hidden = true;
  hint.classList.remove("visible");
  overlayImg.removeAttribute("src");
  if (overlayUrl) {
    URL.revokeObjectURL(overlayUrl);
    overlayUrl = null;
  }
});

// ---- 撮影 ----

shutterBtn.addEventListener("click", () => {
  if (isCapturing || shutterBtn.disabled) return;
  isCapturing = true;

  flash.classList.remove("on");
  void flash.offsetWidth; // アニメーションを再生し直すためのリフロー
  flash.classList.add("on");

  try {
    const canvas = composite(
      video,
      facingMode === "user",
      hasOverlay ? { img: overlayImg, transform } : null,
      stage.clientWidth,
    );
    canvas.toBlob(
      (blob) => {
        isCapturing = false;
        if (!blob) return;
        showResult(blob);
      },
      "image/jpeg",
      0.95,
    );
  } catch (err) {
    isCapturing = false;
    console.error("撮影エラー:", err);
  }
});

function showResult(blob: Blob): void {
  resultBlob = blob;
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = URL.createObjectURL(blob);
  resultImg.src = resultUrl;
  shareBtn.hidden = !canShareBlob(blob);
  result.hidden = false;
}

function closeResult(): void {
  result.hidden = true;
  resultImg.removeAttribute("src");
  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }
  resultBlob = null;
}

closeResultBtn.addEventListener("click", closeResult);

function fileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `overlaycam_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`
  );
}

saveBtn.addEventListener("click", () => {
  if (!resultUrl) return;
  const a = document.createElement("a");
  a.href = resultUrl;
  a.download = fileName();
  a.click();
});

function toShareFile(blob: Blob): File {
  return new File([blob], fileName(), { type: "image/jpeg" });
}

function canShareBlob(blob: Blob): boolean {
  return (
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [toShareFile(blob)] })
  );
}

shareBtn.addEventListener("click", () => {
  if (!resultBlob) return;
  navigator
    .share({ files: [toShareFile(resultBlob)] })
    .catch(() => {
      /* ユーザーによるキャンセルは無視 */
    });
});

// ---- 起動 ----
void initCamera();
