import type { Grid } from "./gameTypes";

type GameGridProps = {
  displayGrid: Grid;
};

export default function GameGrid({ displayGrid }: GameGridProps) {
  return (
    <div className="board-frame">
      <div className="board">
        {displayGrid.map((row: Array<string | null>, rowIndex: number) => (
          <div key={rowIndex} className="row">
            {row.map((cell: string | null, colIndex: number) => (
              <div
                key={colIndex}
                className="cell"
                style={{ backgroundColor: cell || "#050816" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
