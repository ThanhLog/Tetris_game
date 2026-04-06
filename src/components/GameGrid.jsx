export default function GameGrid({ displayGrid }) {
  return (
    <div className="board-frame">
      <div className="board">
        {displayGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
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
