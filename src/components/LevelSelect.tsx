import type { GameMode, Level } from "./gameTypes";

const LEVEL_OPTIONS = [
  { value: "easy", label: "Easy", accent: "level-easy" },
  { value: "medium", label: "Medium", accent: "level-medium" },
  { value: "hard", label: "Hard", accent: "level-hard" },
] as const satisfies ReadonlyArray<{ value: Level; label: string; accent: string }>;

type LevelSelectProps = {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  onSelect: (level: Level) => void;
  selectedLevel: Level;
};

export default function LevelSelect({
  gameMode,
  onGameModeChange,
  onSelect,
  selectedLevel,
}: LevelSelectProps) {
  return (
    <section className="level-container">
      <p className="game-panel-label">Select Mode</p>
      <h2 className="level-title">Chon che do va cap do</h2>
      <p className="level-subtitle">
        Cu chi trai phai van dung de doi cap do. Che do choi co the doi bang nut bam.
      </p>

      <div className="mode-options">
        <button
          type="button"
          className={`mode-button ${gameMode === "solo" ? "mode-button-active" : ""}`}
          onClick={() => onGameModeChange("solo")}
        >
          Solo
        </button>
        <button
          type="button"
          className={`mode-button ${gameMode === "local-multiplayer" ? "mode-button-active" : ""}`}
          onClick={() => onGameModeChange("local-multiplayer")}
        >
          Local Multiplayer
        </button>
      </div>

      <div className="level-options">
        {LEVEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`level-button ${option.accent} ${
              selectedLevel === option.value ? "level-button-active" : ""
            }`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
