import { useState, useEffect } from "react";

interface BrushSizePickerProps {
  onSelectBrushSize: (width: number, height: number) => void;
}

interface BrushSizeOption {
  width: number;
  height: number;
  label: string;
}

const BRUSH_SIZES: BrushSizeOption[] = [
  { width: 1, height: 1, label: "1×1" },
  { width: 1, height: 2, label: "1×2" },
  { width: 2, height: 1, label: "2×1" },
  { width: 2, height: 2, label: "2×2" },
  { width: 2, height: 3, label: "2×3" },
  { width: 3, height: 2, label: "3×2" },
  { width: 3, height: 3, label: "3×3" },
];

export const BrushSizePicker = ({ onSelectBrushSize }: BrushSizePickerProps) => {
  const [selectedBrush, setSelectedBrush] = useState<string>("1×1");

  // Устанавливаем дефолтный размер кисти 1×1 при монтировании
  useEffect(() => {
    console.log('[BrushSizePicker] Setting default brush size 1×1');
    onSelectBrushSize(1, 1);
  }, [onSelectBrushSize]);

  const handleSelectBrush = (option: BrushSizeOption) => {
    console.log('[BrushSizePicker] Selected brush size:', option);
    setSelectedBrush(option.label);
    onSelectBrushSize(option.width, option.height);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
        Размер кисти
      </h3>
      <div className="grid grid-cols-4 gap-1.5">
        {BRUSH_SIZES.map((option) => (
          <button
            key={option.label}
            onClick={() => handleSelectBrush(option)}
            className={`px-2 py-1.5 rounded text-xs font-bold transition-colors ${
              selectedBrush === option.label
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title={`Brush size: ${option.label}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
