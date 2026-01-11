/**
 * Скрипт для конвертации PNG карты мира в JSON формат игры
 *
 * Использование:
 *   node scripts/convertMapImage.js public/maps/interdest_map.png public/maps/interdest_map.json
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Маппинг RGB цветов в типы клеток
const COLOR_TO_CELL_TYPE = {
  // Океан (тёмно-синий)
  '0,28,61': 'water',        // основной цвет океана
  '1,29,62': 'water',
  '2,30,63': 'water',

  // Суша (песочный/бежевый)
  '194,140,83': 'grass',     // основной цвет суши
  '195,141,84': 'grass',
  '193,139,82': 'grass',

  // Граница суша/вода (тёмно-синий у берега)
  '0,42,92': 'water',
  '1,43,93': 'water',

  // Fallback для неизвестных цветов
  'default': 'grass'
};

/**
 * Конвертирует RGB в строку-ключ
 */
function rgbToKey(r, g, b) {
  return `${r},${g},${b}`;
}

/**
 * Определяет тип клетки по цвету пикселя
 */
function pixelToCellType(r, g, b) {
  const key = rgbToKey(r, g, b);

  // Точное совпадение
  if (COLOR_TO_CELL_TYPE[key]) {
    return COLOR_TO_CELL_TYPE[key];
  }

  // Определяем по диапазонам (синий = вода, остальное = земля)
  if (b > r && b > g && b > 50) {
    return 'water';
  }

  if (r > 100 && g > 80 && b < 100) {
    return 'grass';
  }

  // Тёмные цвета = вода
  if (r < 50 && g < 50 && b < 100) {
    return 'water';
  }

  return COLOR_TO_CELL_TYPE.default;
}

/**
 * Конвертирует изображение в сетку клеток
 */
async function convertImageToGrid(imagePath) {
  console.log(`Загрузка изображения: ${imagePath}`);

  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

  console.log(`Размер изображения: ${image.width}x${image.height}`);
  console.log(`Размер в клетках 16x16: ${Math.floor(image.width / 16)}x${Math.floor(image.height / 16)}`);

  const gridWidth = Math.floor(image.width / 16);
  const gridHeight = Math.floor(image.height / 16);

  const grid = [];

  // Создаём сетку, беря каждый 16-й пиксель
  for (let y = 0; y < gridHeight; y++) {
    const row = [];

    for (let x = 0; x < gridWidth; x++) {
      // Берём центральный пиксель клетки 16x16
      const pixelX = x * 16 + 8;
      const pixelY = y * 16 + 8;
      const pixelIndex = (pixelY * image.width + pixelX) * 4;

      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];

      const cellType = pixelToCellType(r, g, b);

      row.push({
        x,
        y,
        type: cellType,
        item: null,
        enemy: null,
        explored: false,
        visible: false
      });
    }

    grid.push(row);

    if ((y + 1) % 50 === 0) {
      console.log(`Обработано строк: ${y + 1}/${gridHeight}`);
    }
  }

  console.log(`Сетка создана: ${gridWidth}x${gridHeight} клеток`);

  // Статистика
  let waterCount = 0;
  let landCount = 0;

  grid.forEach(row => {
    row.forEach(cell => {
      if (cell.type === 'water') waterCount++;
      else landCount++;
    });
  });

  console.log(`Статистика:`);
  console.log(`  Вода: ${waterCount} (${(waterCount / (gridWidth * gridHeight) * 100).toFixed(1)}%)`);
  console.log(`  Суша: ${landCount} (${(landCount / (gridWidth * gridHeight) * 100).toFixed(1)}%)`);

  return {
    width: gridWidth,
    height: gridHeight,
    grid
  };
}

/**
 * Сохраняет сетку в JSON файл
 */
function saveGridToJson(gridData, outputPath) {
  console.log(`Сохранение в: ${outputPath}`);

  const data = {
    version: 1,
    name: 'World Map',
    width: gridData.width,
    height: gridData.height,
    grid: gridData.grid
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  const fileSize = fs.statSync(outputPath).size;
  console.log(`Файл сохранён (${(fileSize / 1024).toFixed(1)} KB)`);
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Использование: node convertMapImage.js <input.png> <output.json>');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  if (!fs.existsSync(inputPath)) {
    console.error(`Файл не найден: ${inputPath}`);
    process.exit(1);
  }

  try {
    const gridData = await convertImageToGrid(inputPath);
    saveGridToJson(gridData, outputPath);

    console.log('\n✅ Конвертация завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();
