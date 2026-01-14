import { useRef, useEffect, useState } from "react";
import { TILESET_REGISTRY } from "../../excalibur/config/TilesetConfig";

interface TilesetPickerProps {
  onSelectTile: (tilesetId: string, x: number, y: number) => void;
  selectedTilesetId?: string;
}

export const TilesetPicker = ({ onSelectTile, selectedTilesetId = 'grassBiome' }: TilesetPickerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTileset, setCurrentTileset] = useState(selectedTilesetId);
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null);

  const TILE_SIZE = 16;
  const DISPLAY_SCALE = 2; // Увеличение для удобства

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const tileset = TILESET_REGISTRY[currentTileset];
    if (!tileset) return;

    const img = new Image();
    img.src = tileset.imagePath;

    img.onload = () => {
      // Размер canvas
      canvas.width = tileset.columns * TILE_SIZE * DISPLAY_SCALE;
      canvas.height = tileset.rows * TILE_SIZE * DISPLAY_SCALE;

      // Отрисовка тайлсета
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Сетка
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;

      for (let y = 0; y <= tileset.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE * DISPLAY_SCALE);
        ctx.lineTo(canvas.width, y * TILE_SIZE * DISPLAY_SCALE);
        ctx.stroke();
      }

      for (let x = 0; x <= tileset.columns; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE * DISPLAY_SCALE, 0);
        ctx.lineTo(x * TILE_SIZE * DISPLAY_SCALE, canvas.height);
        ctx.stroke();
      }

      // Подсветка выбранного
      if (selectedTile) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          selectedTile.x * TILE_SIZE * DISPLAY_SCALE,
          selectedTile.y * TILE_SIZE * DISPLAY_SCALE,
          TILE_SIZE * DISPLAY_SCALE,
          TILE_SIZE * DISPLAY_SCALE
        );
      }

      // Подсветка наведенного
      if (hoveredTile && (hoveredTile.x !== selectedTile?.x || hoveredTile.y !== selectedTile?.y)) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          hoveredTile.x * TILE_SIZE * DISPLAY_SCALE,
          hoveredTile.y * TILE_SIZE * DISPLAY_SCALE,
          TILE_SIZE * DISPLAY_SCALE,
          TILE_SIZE * DISPLAY_SCALE
        );
      }
    };
  }, [currentTileset, selectedTile, hoveredTile]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * DISPLAY_SCALE));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * DISPLAY_SCALE));

    setSelectedTile({ x, y });
    onSelectTile(currentTileset, x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * DISPLAY_SCALE));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * DISPLAY_SCALE));

    setHoveredTile({ x, y });
  };

  return (
    <div className="space-y-3">
      {/* Переключатель тайлсетов */}
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(TILESET_REGISTRY).map(id => (
          <button
            key={id}
            onClick={() => setCurrentTileset(id)}
            className={`px-2 py-1.5 rounded text-[10px] font-bold transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
              currentTileset === id
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title={TILESET_REGISTRY[id].name}
          >
            {TILESET_REGISTRY[id].name}
          </button>
        ))}
      </div>

      <div className="overflow-auto max-h-96 border border-gray-700 rounded">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTile(null)}
          className="cursor-crosshair"
        />
      </div>

      {selectedTile && (
        <div className="text-xs text-slate-400">
          Selected: ({selectedTile.x}, {selectedTile.y}) from {TILESET_REGISTRY[currentTileset].name}
        </div>
      )}
    </div>
  );
};
