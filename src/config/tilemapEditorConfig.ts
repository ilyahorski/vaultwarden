/**
 * Конфигурация тайлсетов для tilemap-editor
 */

export interface TilesetConfig {
  src: string;
  name: string;
  description?: string;
  link?: string;
}

/**
 * Предзагруженные тайлсеты из проекта
 */
export const PRELOADED_TILESETS: TilesetConfig[] = [
  // Основные биомы
  {
    src: '/maps/open_world_tiles/grassBiome_singleLayer.png',
    name: 'Grass Biome',
    description: 'Травяной биом'
  },
  {
    src: '/maps/open_world_tiles/desertBiome_singleLayer.png',
    name: 'Desert Biome',
    description: 'Пустынный биом'
  },
  {
    src: '/maps/open_world_tiles/snowBiome_singleLayer.png',
    name: 'Snow Biome',
    description: 'Снежный биом'
  },
  {
    src: '/maps/open_world_tiles/swampBiome_singleLayer.png',
    name: 'Swamp Biome',
    description: 'Болотный биом'
  },
  {
    src: '/maps/open_world_tiles/volcanicBiome_singleLayer.png',
    name: 'Volcanic Biome',
    description: 'Вулканический биом'
  },
  {
    src: '/maps/open_world_tiles/wastelandBiome_singleLayer.png',
    name: 'Wasteland Biome',
    description: 'Пустошь'
  },

  // Переходы между биомами
  {
    src: '/maps/open_world_tiles/biomeTransitions_singleLayer.png',
    name: 'Biome Transitions',
    description: 'Переходы между биомами'
  },

  // Водные переходы
  {
    src: '/maps/open_world_tiles/waterBiome_grassEdge_singleLayer.png',
    name: 'Water (Grass Edge)',
    description: 'Вода с травяным берегом'
  },
  {
    src: '/maps/open_world_tiles/waterBiome_desertEdge_singleLayer.png',
    name: 'Water (Desert Edge)',
    description: 'Вода с пустынным берегом'
  },
  {
    src: '/maps/open_world_tiles/waterBiome_snowEdge_singleLayer.png',
    name: 'Water (Snow Edge)',
    description: 'Вода со снежным берегом'
  },
  {
    src: '/maps/open_world_tiles/waterBiome_swampEdge_singleLayer.png',
    name: 'Water (Swamp Edge)',
    description: 'Вода с болотным берегом'
  },
  {
    src: '/maps/open_world_tiles/waterBiome_volcanicEdge_singleLayer.png',
    name: 'Water (Volcanic Edge)',
    description: 'Вода с вулканическим берегом'
  },
  {
    src: '/maps/open_world_tiles/waterBiome_wastelandEdge_singleLayer.png',
    name: 'Water (Wasteland Edge)',
    description: 'Вода с пустошью'
  },

  // Village тайлсеты
  {
    src: '/maps/open_world_tiles/Village_TerrainTiles.png',
    name: 'Village Terrain',
    description: 'Деревенский ландшафт'
  },
  {
    src: '/maps/open_world_tiles/Village_BuildingTiles.png',
    name: 'Village Buildings',
    description: 'Деревенские здания'
  },
  {
    src: '/maps/open_world_tiles/Village_ObjectTiles.png',
    name: 'Village Objects',
    description: 'Деревенские объекты'
  },
  {
    src: '/maps/open_world_tiles/Village_AnimatedWaterTiles.png',
    name: 'Village Water (Animated)',
    description: 'Анимированная вода'
  },

  // Village Interior
  {
    src: '/maps/open_world_tiles/VillageInterior_Structure.png',
    name: 'Interior Structure',
    description: 'Структура интерьера'
  },
  {
    src: '/maps/open_world_tiles/VillageInterior_Objects.png',
    name: 'Interior Objects',
    description: 'Объекты интерьера'
  },
  {
    src: '/maps/open_world_tiles/VillageInterior_Rugs.png',
    name: 'Interior Rugs',
    description: 'Ковры для интерьера'
  },

  // ЛОГИЧЕСКИЕ ТАЙЛСЕТЫ (для редактора)
  // ПРИМЕЧАНИЕ: PNG файлы нужно создать вручную (см. план)
  {
    src: '/tilesets/logic/collision.png',
    name: 'Collision Layer',
    description: 'Коллизии и проходимость (4 тайла: прозрачный, красный=непроходимый, желтый=частично, зеленый=проходимый)'
  },
  {
    src: '/tilesets/logic/triggers.png',
    name: 'Triggers Layer',
    description: 'Триггеры и интерактивные зоны (8 тайлов: bonfire, trap, lava, merchant, portal, chest, npc_spawn, enemy_spawn)'
  },
  {
    src: '/tilesets/logic/time_layers.png',
    name: 'Time Layers',
    description: 'Временные слои (3 тайла: past=янтарный, present=зеленый, future=фиолетовый)'
  }
];

/**
 * Начальные размеры карты
 */
export const DEFAULT_MAP_CONFIG = {
  tileSize: 16,
  mapWidth: 50,
  mapHeight: 50
};

/**
 * Типы данных tilemap-editor
 */
export interface TilemapEditorData {
  maps: Record<string, TilemapMap>;
  tileSets: Record<string, TileSet>;
}

export interface TilemapMap {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    bottom: (number | null)[][];
    middle: (number | null)[][];
    top: (number | null)[][];
  };
}

export interface TileSet {
  src: string;
  name: string;
  tileSize: number;
  columns: number;
  rows: number;
  tiles?: Record<string, TileData>;
}

export interface TileData {
  symbol?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface FlattenedMapData {
  width: number;
  height: number;
  tileSize: number;
  layers: {
    bottom: string[];
    middle: string[];
    top: string[];
  };
}
