#!/usr/bin/env python3
"""
Создает спрайт-листы для героя с анимацией движения в 4 направлениях.
Результат: 4 ряда по 8 кадров (32 кадра всего) в формате 128x64 (8 кадров × 16px × 4 направления × 16px)
"""

from PIL import Image
import os

# Пути к файлам
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'Hero')
OUTPUT_DIR = os.path.join(BASE_DIR, 'public', 'sprites')

HERO_SPRITESHEET = os.path.join(ASSETS_DIR, '16x16 Hero.png')
CLIMB_DIR = os.path.join(ASSETS_DIR, 'Climb')
SLIDE_DIR = os.path.join(ASSETS_DIR, 'Slide')

# Размеры спрайтов
SPRITE_SIZE = 16
FRAMES_PER_ROW = 8
NUM_DIRECTIONS = 4

def extract_row_from_sheet(sheet_path, row, num_frames=8, source_sprite_size=None):
    """Извлекает кадры из одной строки спрайт-листа"""
    img = Image.open(sheet_path)
    frames = []

    # Автоопределение размера спрайта если не указан
    if source_sprite_size is None:
        source_sprite_size = img.width // 16  # предполагаем 16 кадров по ширине в исходнике

    for col in range(num_frames):
        x = col * source_sprite_size
        y = row * source_sprite_size
        frame = img.crop((x, y, x + source_sprite_size, y + source_sprite_size))

        # Масштабируем до целевого размера если нужно
        if frame.size != (SPRITE_SIZE, SPRITE_SIZE):
            frame = frame.resize((SPRITE_SIZE, SPRITE_SIZE), Image.NEAREST)

        frames.append(frame)

    return frames

def load_frames_from_folder(folder_path, prefix, count):
    """Загружает отдельные кадры из папки"""
    frames = []
    for i in range(1, count + 1):
        frame_path = os.path.join(folder_path, f'{prefix}{i}.png')
        if os.path.exists(frame_path):
            frame = Image.open(frame_path)

            # Масштабируем до целевого размера если нужно
            if frame.size != (SPRITE_SIZE, SPRITE_SIZE):
                frame = frame.resize((SPRITE_SIZE, SPRITE_SIZE), Image.NEAREST)

            frames.append(frame)
        else:
            print(f"Warning: {frame_path} not found")
    return frames

def flip_frames(frames):
    """Отзеркаливает кадры по горизонтали"""
    return [frame.transpose(Image.FLIP_LEFT_RIGHT) for frame in frames]

def pad_frames(frames, target_count):
    """Дополняет список кадров до нужного количества, повторяя последний кадр"""
    while len(frames) < target_count:
        frames.append(frames[-1] if frames else Image.new('RGBA', (SPRITE_SIZE, SPRITE_SIZE)))
    return frames[:target_count]

def create_hero_spritesheet(output_name='hero_warrior'):
    """Создает полный спрайт-лист героя"""

    # Извлекаем кадры для движения влево (row 1, спрайты 32x32)
    left_frames = extract_row_from_sheet(HERO_SPRITESHEET, 1, FRAMES_PER_ROW, source_sprite_size=32)

    # Отзеркаливаем для движения вправо
    right_frames = flip_frames(left_frames)

    # Загружаем кадры для движения вверх (Climb)
    up_frames = load_frames_from_folder(CLIMB_DIR, 'Climb', 4)
    up_frames = pad_frames(up_frames, FRAMES_PER_ROW)

    # Загружаем кадры для движения вниз (Slide)
    down_frames = load_frames_from_folder(SLIDE_DIR, 'Slide', 7)
    down_frames = pad_frames(down_frames, FRAMES_PER_ROW)

    # Создаем финальный спрайт-лист (128x64)
    spritesheet = Image.new('RGBA', (SPRITE_SIZE * FRAMES_PER_ROW, SPRITE_SIZE * NUM_DIRECTIONS))

    # Размещаем кадры
    directions = [left_frames, right_frames, up_frames, down_frames]
    for row, frames in enumerate(directions):
        for col, frame in enumerate(frames):
            x = col * SPRITE_SIZE
            y = row * SPRITE_SIZE
            spritesheet.paste(frame, (x, y))

    # Сохраняем
    output_path = os.path.join(OUTPUT_DIR, f'{output_name}_directional.png')
    spritesheet.save(output_path)
    print(f"Created: {output_path}")

    return output_path

def main():
    # Создаем спрайт-листы для всех классов героев
    # Пока используем один и тот же базовый спрайт для всех классов
    # Позже можно создать разные варианты

    print("Creating hero sprite sheets...")

    create_hero_spritesheet('hero_warrior')
    create_hero_spritesheet('hero_mage')
    create_hero_spritesheet('hero_rogue')

    print("Done!")
    print("\nSprite sheet layout (128x64):")
    print("Row 0 (left):  8 frames of walking left")
    print("Row 1 (right): 8 frames of walking right (mirrored)")
    print("Row 2 (up):    8 frames of climbing/walking up")
    print("Row 3 (down):  8 frames of sliding/walking down")

if __name__ == '__main__':
    main()
