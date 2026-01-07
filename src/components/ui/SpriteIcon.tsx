import { getSpriteStyle, type SpritePosition, SPRITE_SIZE } from '../../sprites';

interface SpriteIconProps {
  sprite: SpritePosition;
  size?: number;
  className?: string;
}

/**
 * Компонент для отображения спрайта в качестве иконки
 */
export function SpriteIcon({ sprite, size = 16, className = '' }: SpriteIconProps) {
  const spriteStyle = getSpriteStyle(sprite);
  const scale = size / SPRITE_SIZE;

  return (
    <div
      className={`inline-block ${className}`}
      style={{
        ...spriteStyle,
        width: size,
        height: size,
        backgroundSize: `${SPRITE_SIZE * scale * 10}px ${SPRITE_SIZE * scale * 10}px`, // Для tileset 10x10
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    />
  );
}
