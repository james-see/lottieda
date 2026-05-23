import type { LottieAnimation } from "./schema";

export function isLottieAnimation(value: unknown): value is LottieAnimation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LottieAnimation>;
  return (
    typeof candidate.w === "number" &&
    typeof candidate.h === "number" &&
    typeof candidate.fr === "number" &&
    typeof candidate.ip === "number" &&
    typeof candidate.op === "number" &&
    Array.isArray(candidate.layers)
  );
}

export function parseLottieJson(json: string): LottieAnimation {
  const parsed = JSON.parse(json) as unknown;
  if (!isLottieAnimation(parsed)) {
    throw new Error("The selected file is not a supported Lottie animation.");
  }
  return parsed;
}
