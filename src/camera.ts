export type FacingMode = "environment" | "user";

/**
 * カメラを起動して video 要素に接続する。
 *
 * 解像度は 1920x1440 を上限に要求する。ideal: 4096 のような過大な要求は
 * ローエンドAndroid端末 (例: Arrows We2) でカメラドライバがセンサー最大
 * 解像度のストリーミングを試みてブラウザごとクラッシュすることがある。
 */
export async function startCamera(
  video: HTMLVideoElement,
  facingMode: FacingMode,
): Promise<MediaStream> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1440 },
      },
      audio: false,
    });
  } catch (err) {
    // 権限拒否以外 (解像度指定に起因する失敗など) は指定なしで再試行する
    if (err instanceof DOMException && err.name !== "NotAllowedError") {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
    } else {
      throw err;
    }
  }
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/** カメラが2台以上あるか (切り替えボタンの表示判定に使う) */
export async function hasMultipleCameras(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput").length > 1;
  } catch {
    return false;
  }
}

/** getUserMedia のエラーをユーザー向けメッセージに変換する */
export function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return "カメラへのアクセスが許可されませんでした。\nブラウザの設定からカメラの使用を許可して、再試行してください。";
      case "NotFoundError":
      case "OverconstrainedError":
        return "利用できるカメラが見つかりませんでした。";
      case "NotReadableError":
        return "カメラを起動できませんでした。\n他のアプリがカメラを使用中かもしれません。";
    }
  }
  return "カメラの起動中にエラーが発生しました。";
}
