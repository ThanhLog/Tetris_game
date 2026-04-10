import {
  FilesetResolver,
  HandLandmarker,
  type Category,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import type { ActionType, Level } from "./gameTypes";

type CamProps = {
  onAction?: (action: ActionType) => void;
  screen?: "menu" | "playing" | "gameover";
  selectedLevel?: Level;
};

type GestureState = {
  action: ActionType | null;
  gesture: string;
  handLabel: string;
};

const ACTION_COOLDOWN_MS: Record<ActionType, number> = {
  LEFT: 280,
  RIGHT: 280,
  ROTATE: 900,
  DOWN: 160,
};
const SIDE_CONTROL_ZONE_RATIO = 0.28;

function countOpenFingers(landmarks: NormalizedLandmark[]) {
  const isExtended = (tipIndex: number, pipIndex: number) =>
    landmarks[tipIndex].y < landmarks[pipIndex].y;

  return {
    index: isExtended(8, 6),
    middle: isExtended(12, 10),
    ring: isExtended(16, 14),
    pinky: isExtended(20, 18),
  };
}

function normalizeHandLabel(handedness?: Category[][]) {
  const rawLabel = handedness?.[0]?.[0]?.categoryName;

  if (rawLabel === "Left") return "Right";
  if (rawLabel === "Right") return "Left";

  return "Unknown";
}

function detectGesture(
  landmarks: NormalizedLandmark[],
  handedness?: Category[][],
): GestureState {
  const normalizedHandLabel = normalizeHandLabel(handedness);
  const fingers = countOpenFingers(landmarks);
  const extendedCount = Object.values(fingers).filter(Boolean).length;
  const centerX =
    (landmarks[0].x +
      landmarks[5].x +
      landmarks[9].x +
      landmarks[13].x +
      landmarks[17].x) /
    5;

  if (extendedCount === 0) {
    return { action: "ROTATE", gesture: "Fist", handLabel: normalizedHandLabel };
  }

  if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return { action: "DOWN", gesture: "Two Fingers", handLabel: normalizedHandLabel };
  }

  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    if (centerX < SIDE_CONTROL_ZONE_RATIO) {
      return { action: "RIGHT", gesture: "Point Left Zone", handLabel: normalizedHandLabel };
    }

    if (centerX > 1 - SIDE_CONTROL_ZONE_RATIO) {
      return { action: "LEFT", gesture: "Point Right Zone", handLabel: normalizedHandLabel };
    }

    return { action: null, gesture: "Point Center", handLabel: normalizedHandLabel };
  }

  return {
    action: null,
    gesture: extendedCount >= 3 ? "Open Hand" : "Tracking",
    handLabel: normalizedHandLabel,
  };
}

function drawHandOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[] | null,
  gesture: string,
  status: string,
  activeAction: ActionType | null,
) {
  const context = canvas.getContext("2d");

  if (!context) return;

  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;

  context.clearRect(0, 0, width, height);

  const leftGuide = width * SIDE_CONTROL_ZONE_RATIO;
  const rightGuide = width * (1 - SIDE_CONTROL_ZONE_RATIO);

  context.fillStyle = "rgba(14, 165, 233, 0.05)";
  context.fillRect(0, 0, leftGuide, height);
  context.fillRect(rightGuide, 0, width - rightGuide, height);
  context.strokeStyle = "rgba(56, 189, 248, 0.3)";
  context.lineWidth = 2;
  context.setLineDash([8, 8]);
  context.beginPath();
  context.moveTo(leftGuide, 0);
  context.lineTo(leftGuide, height);
  context.moveTo(rightGuide, 0);
  context.lineTo(rightGuide, height);
  context.stroke();
  context.setLineDash([]);

  if (landmarks) {
    context.strokeStyle = "#38bdf8";
    context.lineWidth = 3;

    HandLandmarker.HAND_CONNECTIONS.forEach(({ start, end }) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      context.beginPath();
      context.moveTo(startPoint.x * width, startPoint.y * height);
      context.lineTo(endPoint.x * width, endPoint.y * height);
      context.stroke();
    });

    landmarks.forEach((landmark, index) => {
      context.beginPath();
      context.fillStyle = index === 8 ? "#22c55e" : "#f8fafc";
      context.arc(landmark.x * width, landmark.y * height, index === 8 ? 6 : 4, 0, Math.PI * 2);
      context.fill();
    });
  }

  if (activeAction) {
    context.fillStyle = "rgba(2, 132, 199, 0.88)";
    context.fillRect(16, 16, 132, 38);
    context.fillStyle = "#f8fafc";
    context.font = "700 18px Segoe UI";
    context.fillText(`Action: ${activeAction}`, 28, 41);
  }

  context.fillStyle = "rgba(2, 6, 23, 0.78)";
  context.fillRect(12, height - 74, 190, 28);
  context.fillRect(12, height - 40, 190, 28);
  context.fillStyle = "#cbd5e1";
  context.font = "600 14px Segoe UI";
  context.fillText(`Status: ${status}`, 22, height - 55);
  context.fillText(`Gesture: ${gesture}`, 22, height - 21);
}

function getScreenHint(screen: CamProps["screen"], selectedLevel?: string) {
  if (screen === "menu") {
    return `Mode: ${selectedLevel ?? "easy"} | Tro trai phai de chon | Nam tay de vao game`;
  }

  if (screen === "gameover") {
    return "Nam tay hoac hai ngon de restart | Tro trai phai de quay ve menu";
  }

  return "Tro de di chuyen | Nam tay de xoay | Hai ngon de day xuong";
}

export default function Cam({ onAction, screen = "playing", selectedLevel }: CamProps) {
  const webcamRef = useRef<Webcam>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const activeActionTimeoutRef = useRef<number | null>(null);
  const lastActionTimesRef = useRef<Record<ActionType, number>>({
    LEFT: 0,
    RIGHT: 0,
    ROTATE: 0,
    DOWN: 0,
  });
  const statusRef = useRef("Dang tai hand tracker...");
  const gestureRef = useRef("Idle");
  const activeActionRef = useRef<ActionType | null>(null);
  const onActionRef = useRef(onAction);

  const [status, setStatus] = useState("Dang tai hand tracker...");
  const [gesture, setGesture] = useState("Idle");
  const [handLabel, setHandLabel] = useState("Unknown");
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    gestureRef.current = gesture;
  }, [gesture]);

  useEffect(() => {
    activeActionRef.current = activeAction;
  }, [activeAction]);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  useEffect(() => {
    let cancelled = false;

    async function initHandLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks("/tasks-vision/wasm");

        if (cancelled) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          numHands: 1,
          runningMode: "VIDEO",
          minHandDetectionConfidence: 0.65,
          minHandPresenceConfidence: 0.65,
          minTrackingConfidence: 0.65,
        });

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;
        setStatus("Hand tracker san sang");
      } catch (error) {
        console.error("HandLandmarker init failed", error);
        if (!cancelled) {
          setStatus("Khong tai duoc hand tracker");
        }
      }
    }

    const loop = () => {
      if (cancelled) return;

      const video = webcamRef.current?.video;
      const overlay = overlayRef.current;

      if (video && overlay && video.readyState >= 2) {
        if (handLandmarkerRef.current && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          try {
            const results: HandLandmarkerResult = handLandmarkerRef.current.detectForVideo(
              video,
              performance.now(),
            );

            const landmarks = results.landmarks?.[0] ?? null;

            if (!landmarks) {
              setStatus((prev) => (prev === "Khong tai duoc hand tracker" ? prev : "Khong thay ban tay"));
              setGesture("Idle");
              setHandLabel("Unknown");
              drawHandOverlay(overlay, video, null, "Idle", statusRef.current, activeActionRef.current);
            } else {
              const gestureState = detectGesture(landmarks, results.handedness);
              setStatus("Dang track ban tay");
              setGesture(gestureState.gesture);
              setHandLabel(gestureState.handLabel);
              drawHandOverlay(
                overlay,
                video,
                landmarks,
                gestureState.gesture,
                "Hand tracked",
                activeActionRef.current,
              );

              if (gestureState.action && onActionRef.current) {
                const now = performance.now();

                if (
                  now - lastActionTimesRef.current[gestureState.action] >=
                  ACTION_COOLDOWN_MS[gestureState.action]
                ) {
                  lastActionTimesRef.current[gestureState.action] = now;
                  onActionRef.current(gestureState.action);
                  setActiveAction(gestureState.action);

                  if (activeActionTimeoutRef.current) {
                    window.clearTimeout(activeActionTimeoutRef.current);
                  }

                  activeActionTimeoutRef.current = window.setTimeout(() => {
                    setActiveAction(null);
                  }, 280);
                }
              }
            }
          } catch (error) {
            console.error("HandLandmarker frame failed", error);
            setStatus("Xu ly frame that bai");
          }
        } else {
          drawHandOverlay(
            overlay,
            video,
            null,
            gestureRef.current,
            statusRef.current,
            activeActionRef.current,
          );
        }
      }

      frameRequestRef.current = window.requestAnimationFrame(loop);
    };

    initHandLandmarker();
    frameRequestRef.current = window.requestAnimationFrame(loop);

    return () => {
      cancelled = true;

      if (frameRequestRef.current) {
        window.cancelAnimationFrame(frameRequestRef.current);
      }

      if (activeActionTimeoutRef.current) {
        window.clearTimeout(activeActionTimeoutRef.current);
      }

      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
    };
  }, []);

  return (
    <div className="camera-background">
      <div className="camera-frame camera-frame-background">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="camera-video camera-video-background"
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
        />
        <canvas ref={overlayRef} className="camera-overlay" />
      </div>

      <div className="camera-background-shade" />

      <div className="camera-hud">
        <div className="camera-hud-row">
          <span className="camera-chip">Status: {status}</span>
          <span className="camera-chip">Gesture: {gesture}</span>
          <span className="camera-chip">Hand: {handLabel}</span>
        </div>
        <p className="camera-hud-hint">{getScreenHint(screen, selectedLevel)}</p>
      </div>
    </div>
  );
}
