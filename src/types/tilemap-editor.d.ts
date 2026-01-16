/**
 * Type declarations for tilemap-editor package
 * @see https://github.com/blurymind/tilemap-editor
 */
declare module 'tilemap-editor/src/tilemap-editor.js' {
  export interface TileSetImage {
    src: string;
    name?: string;
    description?: string;
  }

  export interface TilemapEditorOptions {
    /** Initial tilemap data */
    tileMapData?: unknown;
    /** Tile size in pixels */
    tileSize?: number;
    /** Map width in tiles */
    mapWidth?: number;
    /** Map height in tiles */
    mapHeight?: number;
    /** Preloaded tileset images */
    tileSetImages?: TileSetImage[];
    /** Apply button configuration */
    onApply?: {
      buttonText?: string;
      onClick?: (data: {
        flattenedData: unknown;
        maps: unknown;
        tileSets: unknown;
      }) => void;
    };
    /** Called on map update */
    onUpdate?: (event: unknown) => void;
  }

  interface TilemapEditorAPI {
    init: (containerId: string, options: TilemapEditorOptions) => void;
    setMode?: (mode: 'paint' | 'select' | 'fill') => void;
    getMapData?: () => {
      maps: Record<string, {
        name: string;
        width: number;
        height: number;
        tileSize: number;
        layers: {
          bottom: (number | null)[][];
          middle: (number | null)[][];
          top: (number | null)[][];
        };
      }>;
      tileSets: Record<string, {
        src: string;
        name: string;
        tileSize: number;
        columns: number;
        rows: number;
        tiles?: Record<string, { symbol?: string; tags?: string[]; metadata?: Record<string, unknown> }>;
      }>;
    };
    loadMapData?: (data: unknown) => void;
  }

  const TilemapEditor: TilemapEditorAPI;

  export default TilemapEditor;
}

declare module 'tilemap-editor/src/styles.css' {
  const content: string;
  export default content;
}
