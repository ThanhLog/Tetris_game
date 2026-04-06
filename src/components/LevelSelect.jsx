const LEVEL_OPTIONS = [
  { value: "easy", label: "Easy", accent: "level-easy" },
  { value: "medium", label: "Medium", accent: "level-medium" },
  { value: "hard", label: "Hard", accent: "level-hard" },
];

export default function LevelSelect({ onSelect, selectedLevel }) {
  return (
    <section className="level-container">
      <p className="game-panel-label">Select Mode</p>
      <h2 className="level-title">Chon cap do bang cu chi tay</h2>
      <p className="level-subtitle">Tro tay trai phai de doi mode, nam tay hoac hai ngon de vao game.</p>

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
