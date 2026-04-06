export default function NextPiecePreview({ nextPiece }) {
  return (
    <div className="game-panel">
      <p className="game-panel-label">Next Piece</p>
      <div className="next-piece">
        {nextPiece.shape.map((row, i) => (
          <div key={i} className="next-piece-row">
            {row.map((cell, j) => (
              <div
                key={j}
                className="next-piece-cell"
                style={{
                  backgroundColor: cell ? nextPiece.color : "transparent",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
