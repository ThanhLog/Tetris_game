import type { Piece } from "./gameTypes";

type NextPiecePreviewProps = {
  nextPiece: Piece;
};

export default function NextPiecePreview({ nextPiece }: NextPiecePreviewProps) {
  return (
    <div className="game-panel">
      <p className="game-panel-label">Next Piece</p>
      <div className="next-piece">
        {nextPiece.shape.map((row: number[], i: number) => (
          <div key={i} className="next-piece-row">
            {row.map((cell: number, j: number) => (
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
