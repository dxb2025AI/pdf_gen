import { BookFormat } from './lib/types';

declare module 'fabric' {
  export interface Object {
    data?: {
      type?: string;
      name?: string;
      isPlaceholder?: boolean;
      placeholderName?: string;
    };
    getScaledWidth(): number;
    getScaledHeight(): number;
    setControlsVisibility(options: {
      mt?: boolean;
      mb?: boolean;
      ml?: boolean;
      mr?: boolean;
      bl?: boolean;
      br?: boolean;
      tl?: boolean;
      tr?: boolean;
      mtr?: boolean;
    }): void;
    bringToFront(): void;
    sendToBack(): void;
    clone(callback: (cloned: Object) => void): void;
  }

  export interface Canvas {
    getObjects(): Object[];
    getActiveObject(): Object | null;
    setActiveObject(object: Object): Canvas;
    getPointer(e: MouseEvent | TouchEvent): { x: number; y: number };
    zoomToPoint(point: { x: number; y: number }, zoom: number): void;
    setZoom(zoom: number): void;
    renderAll(): void;
    requestRenderAll(): void;
    viewportTransform: number[];
    selection: boolean;
    forEachObject(callback: (obj: Object) => void): void;
    toDataURL(options?: { format?: string; quality?: number }): string;
  }

  export interface IEvent<T> {
    e: T;
  }

  export interface Image extends Object {
    scale(scale: number): void;
    set(options: any): Image;
  }

  export interface Rect extends Object {
    set(options: any): Rect;
  }

  export interface Line extends Object {
    set(options: any): Line;
  }

  export interface Text extends Object {
    set(options: any): Text;
  }

  export interface Group extends Object {
    set(options: any): Group;
  }

  export const fabric: {
    Canvas: new (element: string | HTMLCanvasElement, options?: any) => Canvas;
    Image: {
      fromURL(url: string, callback: (img: Image) => void): void;
    };
    Rect: new (options?: any) => Rect;
    Line: new (points: number[], options?: any) => Line;
    Text: new (text: string, options?: any) => Text;
    Group: new (objects: Object[], options?: any) => Group;
  };
}
