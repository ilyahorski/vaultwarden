/**
 * Конвертирует PNG карту в КОМПАКТНЫЙ JSON формат
 * Вместо массива объектов создаёт строку с кодами типов клеток
 *
 * Использование:
 *   node scripts/convertMapToCompact.js public/maps/interdest_map.png public/maps/interdest_map_compact.json
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Маппинг типов клеток в однобуквенные коды
const CELL_TYPE_CODES = {
  'water': 'w',
  'grass': 'g',
  'wall': '#',
  'floor': '.',
  'door': 'd',
  'stairs_down': 'D',
  'stairs_up': 'U'
};

// Обратный маппинг
const CODE_TO_CELL_TYPE = Object.fromEntries(
  Object.entries(CELL_TYPE_CODES).map(([k, v]) => [v, k])
);

/**
 * Определяет тип клетки по цвету пикселя
 */
function pixelToCellType(r, g, b) {
  // Синий = вода
  if (b > r && b > g && b > 50) {
    return 'water';
  }

  // Бежевый/песочный = трава (земля)
  if (r > 100 && g > 80 && b < 100) {
    return 'grass';
  }

  // Тёмные цвета = вода
  if (r < 50 && g < 50 && b < 100) {
    return 'water';
  }

  return 'grass'; // По умолчанию
}

/**
 * Конвертирует изображение в компактный формат
 */
async function convertImageToCompactGrid(imagePath) {
  console.log(`Загрузка изображения: ${imagePath}`);

  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

  console.log(`Размер изображения: ${image.width}x${image.height}`);

  const gridWidth = Math.floor(image.width / 16);
  const gridHeight = Math.floor(image.height / 16);

  console.log(`Размер в клетках 16x16: ${gridWidth}x${gridHeight}`);

  // Создаём массив строк (каждая строка = одна строка карты)
  const rows = [];

  for (let y = 0; y < gridHeight; y++) {
    let rowString = '';

    for (let x = 0; x < gridWidth; x++) {
      // Берём центральный пиксель клетки 16x16
      const pixelX = x * 16 + 8;
      const pixelY = y * 16 + 8;
      const pixelIndex = (pixelY * image.width + pixelX) * 4;

      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];

      const cellType = pixelToCellType(r, g, b);
      const code = CELL_TYPE_CODES[cellType] || 'g';

      rowString += code;
    }

    rows.push(rowString);

    if ((y + 1) % 50 === 0) {
      console.log(`Обработано строк: ${y + 1}/${gridHeight}`);
    }
  }

  console.log(`Сетка создана: ${gridWidth}x${gridHeight} клеток`);

  // Статистика
  const allCells = rows.join('');
  const waterCount = (allCells.match(/w/g) || []).length;
  const landCount = (allCells.match(/g/g) || []).length;
  const total = gridWidth * gridHeight;

  console.log(`Статистика:`);
  console.log(`  Вода: ${waterCount} (${(waterCount / total * 100).toFixed(1)}%)`);
  console.log(`  Суша: ${landCount} (${(landCount / total * 100).toFixed(1)}%)`);

  return {
    width: gridWidth,
    height: gridHeight,
    rows
  };
}

/**
 * Сохраняет сетку в компактный JSON
 */
function saveCompactGrid(gridData, outputPath) {
  console.log(`Сохранение в: ${outputPath}`);

  const data = {
    version: 2,
    format: 'compact',
    name: 'World Map',
    width: gridData.width,
    height: gridData.height,
    legend: CODE_TO_CELL_TYPE,
    rows: gridData.rows
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  const fileSize = fs.statSync(outputPath).size;
  console.log(`Файл сохранён (${(fileSize / 1024).toFixed(1)} KB)`);

  // Сравнение с несжатым форматом
  const uncompressedSize = gridData.width * gridData.height * 100; // ~100 байт на клетку
  const compression = ((1 - fileSize / uncompressedSize) * 100).toFixed(1);
  console.log(`Степень сжатия: ${compression}% (было бы ~${(uncompressedSize / 1024 / 1024).toFixed(1)} MB)`);
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Использование: node convertMapToCompact.js <input.png> <output.json>');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  if (!fs.existsSync(inputPath)) {
    console.error(`Файл не найден: ${inputPath}`);
    process.exit(1);
  }

  try {
    const gridData = await convertImageToCompactGrid(inputPath);
    saveCompactGrid(gridData, outputPath);

    console.log('\n✅ Конвертация завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();
