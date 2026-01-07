#!/usr/bin/env python3
"""
Конвертирует спрайты воды и лавы в формат 16x16 для правильной анимации.
"""

from PIL import Image
import os

# Пути к файлам
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES_DIR = os.path.join(BASE_DIR, 'public', 'sprites')

WATER_SOURCE = os.path.join(SPRITES_DIR, 'watersamples.png')
LAVA_SOURCE = os.path.join(SPRITES_DIR, 'lava_anim.png')
GRASS_SOURCE = os.path.join(SPRITES_DIR, 'grass.png')

WATER_OUTPUT = os.path.join(SPRITES_DIR, 'water_anim_16.png')
LAVA_OUTPUT = os.path.join(SPRITES_DIR, 'lava_anim_16.png')
GRASS_OUTPUT = os.path.join(SPRITES_DIR, 'grass_16.png')

TARGET_SPRITE_SIZE = 16

def convert_water():
    """Конвертирует воду из watersamples.png col 12-19, row 4 в 16x16"""
    print("Converting water sprites from watersamples.png...")
    img = Image.open(WATER_SOURCE)

    # Размеры исходных спрайтов (460x174 = сетка 29x11)
    source_sprite_width = 460 / 29   # 15.86
    source_sprite_height = 174 / 11  # 15.82

    # Координаты: col 12-19, row 4 (8 кадров)
    frames = []
    for col in range(12, 20):  # col 12-19 (8 кадров)
        x = int(col * source_sprite_width)
        y = int(4 * source_sprite_height)

        frame = img.crop((
            x, y,
            x + int(source_sprite_width),
            y + int(source_sprite_height)
        ))

        # Масштабируем до 16x16
        frame_resized = frame.resize((TARGET_SPRITE_SIZE, TARGET_SPRITE_SIZE), Image.NEAREST)
        frames.append(frame_resized)

    # Создаем горизонтальный спрайт-лист (128x16 для 8 кадров)
    output = Image.new('RGBA', (TARGET_SPRITE_SIZE * len(frames), TARGET_SPRITE_SIZE))

    for i, frame in enumerate(frames):
        output.paste(frame, (i * TARGET_SPRITE_SIZE, 0))

    output.save(WATER_OUTPUT)
    print(f"Saved: {WATER_OUTPUT} ({TARGET_SPRITE_SIZE * len(frames)}x16, {len(frames)} frames)")
    return len(frames)

def convert_lava():
    """Конвертирует лаву (уже 16px высота, но 720px ширина = 45 кадров)"""
    print("Converting lava sprites...")
    img = Image.open(LAVA_SOURCE)

    # Лава уже 16px по высоте, просто нужно убедиться что она правильно разбита
    # 720 / 16 = 45 кадров
    num_frames = img.width // TARGET_SPRITE_SIZE

    # Просто копируем, так как уже правильного размера
    output = Image.new('RGBA', (TARGET_SPRITE_SIZE * num_frames, TARGET_SPRITE_SIZE))

    for i in range(num_frames):
        x = i * TARGET_SPRITE_SIZE
        frame = img.crop((x, 0, x + TARGET_SPRITE_SIZE, TARGET_SPRITE_SIZE))
        output.paste(frame, (x, 0))

    output.save(LAVA_OUTPUT)
    print(f"Saved: {LAVA_OUTPUT} ({TARGET_SPRITE_SIZE * num_frames}x16, {num_frames} frames)")
    return num_frames

def convert_grass():
    """Извлекает один спрайт травы из col 20, row 2"""
    print("Converting grass sprite...")
    img = Image.open(GRASS_SOURCE)

    # Определяем размер спрайта (grass.png - 430x367)
    # Предполагаем сетку примерно 26x22 (430/16.5 ≈ 26, 367/16.7 ≈ 22)
    sprite_width = img.width / 26
    sprite_height = img.height / 22

    # Извлекаем col 20, row 2
    x = int(20 * sprite_width)
    y = int(2 * sprite_height)

    grass_sprite = img.crop((
        x, y,
        x + int(sprite_width),
        y + int(sprite_height)
    ))

    # Масштабируем до 16x16
    grass_resized = grass_sprite.resize((TARGET_SPRITE_SIZE, TARGET_SPRITE_SIZE), Image.NEAREST)

    # Сохраняем как одиночный спрайт
    grass_resized.save(GRASS_OUTPUT)
    print(f"Saved: {GRASS_OUTPUT} (16x16, single sprite)")
    return 1

def main():
    print("Converting water, lava, and grass sprites to 16x16 format...")
    print(f"Target sprite size: {TARGET_SPRITE_SIZE}x{TARGET_SPRITE_SIZE}")
    print()

    water_frames = convert_water()
    print()

    lava_frames = convert_lava()
    print()

    grass_frames = convert_grass()
    print()

    print("Done!")
    print(f"\nSummary:")
    print(f"  Water: {water_frames} frames (128x16)")
    print(f"  Lava: {lava_frames} frames ({lava_frames * TARGET_SPRITE_SIZE}x16)")
    print(f"  Grass: {grass_frames} sprite (16x16)")
    print()
    print("Update SPRITE_SHEETS paths to use:")
    print(f"  water: '/sprites/water_anim_16.png'")
    print(f"  lava: '/sprites/lava_anim_16.png'")
    print(f"  grass: '/sprites/grass_16.png'")

if __name__ == '__main__':
    main()
