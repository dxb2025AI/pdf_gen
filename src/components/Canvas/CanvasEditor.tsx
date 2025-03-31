import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { BookFormat } from '../../lib/types';

interface CanvasEditorProps {
  bookFormat: BookFormat;
  showBleed: boolean;
  showGutter: boolean;
  showSafety: boolean;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  bookFormat,
  showBleed = true,
  showGutter = true,
  showSafety = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [panMode, setPanMode] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(0.5); // Grid size in inches

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#f0f0f0',
        preserveObjectStacking: true,
        selection: true,
      });
      
      setCanvas(fabricCanvas);
      
      // Add event listeners for pan mode
      fabricCanvas.on('mouse:down', handleMouseDown);
      fabricCanvas.on('mouse:move', handleMouseMove);
      fabricCanvas.on('mouse:up', handleMouseUp);
      fabricCanvas.on('mouse:wheel', handleMouseWheel);
      
      // Cleanup on unmount
      return () => {
        fabricCanvas.off('mouse:down', handleMouseDown);
        fabricCanvas.off('mouse:move', handleMouseMove);
        fabricCanvas.off('mouse:up', handleMouseUp);
        fabricCanvas.off('mouse:wheel', handleMouseWheel);
        fabricCanvas.dispose();
      };
    }
  }, [canvasRef]);

  // Update canvas when book format changes
  useEffect(() => {
    if (canvas && bookFormat) {
      // Convert dimensions from inches to pixels (assuming 72 DPI)
      const dpi = 72;
      const width = bookFormat.withBleed.width * dpi;
      const height = bookFormat.withBleed.height * dpi;
      
      canvas.setWidth(width);
      canvas.setHeight(height);
      
      // Clear existing guidelines
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (obj.data?.type === 'guideline' || obj.data?.type === 'grid') {
          canvas.remove(obj);
        }
      });
      
      // Draw guidelines if enabled
      if (showBleed) {
        drawBleedMargins(canvas, bookFormat, dpi);
      }
      
      if (showSafety) {
        drawSafetyMargins(canvas, bookFormat, dpi);
      }
      
      if (showGutter) {
        drawGutterArea(canvas, bookFormat, dpi);
      }
      
      if (showGrid) {
        drawGrid(canvas, width, height, dpi);
      }
      
      if (showRulers) {
        drawRulers(canvas, width, height, dpi);
      }
      
      canvas.renderAll();
      
      // Reset zoom to fit canvas in container
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
        setZoom(scale);
        canvas.setZoom(scale);
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0];
        canvas.renderAll();
      }
    }
  }, [canvas, bookFormat, showBleed, showGutter, showSafety, showGrid, showRulers, gridSize]);

  // Pan and zoom functionality
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPosX, setLastPosX] = useState<number>(0);
  const [lastPosY, setLastPosY] = useState<number>(0);

  const handleMouseDown = (opt: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !panMode) return;
    
    setIsPanning(true);
    if (opt.e.touches && opt.e.touches.length === 1) {
      // Touch device
      setLastPosX(opt.e.touches[0].clientX);
      setLastPosY(opt.e.touches[0].clientY);
    } else {
      // Mouse device
      setLastPosX(opt.e.clientX);
      setLastPosY(opt.e.clientY);
    }
    
    // Disable object selection during panning
    canvas.selection = false;
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = false;
      obj.evented = false;
    });
  };

  const handleMouseMove = (opt: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !isPanning || !panMode) return;
    
    let currentX, currentY;
    if (opt.e.touches && opt.e.touches.length === 1) {
      // Touch device
      currentX = opt.e.touches[0].clientX;
      currentY = opt.e.touches[0].clientY;
    } else {
      // Mouse device
      currentX = opt.e.clientX;
      currentY = opt.e.clientY;
    }
    
    // Calculate delta
    const deltaX = currentX - lastPosX;
    const deltaY = currentY - lastPosY;
    
    // Update last position
    setLastPosX(currentX);
    setLastPosY(currentY);
    
    // Pan the canvas
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      canvas.requestRenderAll();
    }
  };

  const handleMouseUp = () => {
    if (!canvas) return;
    
    setIsPanning(false);
    
    // Re-enable object selection after panning
    canvas.selection = true;
    canvas.forEachObject((obj: fabric.Object) => {
      obj.selectable = true;
      obj.evented = true;
    });
  };

  const handleMouseWheel = (opt: fabric.IEvent<WheelEvent>) => {
    if (!canvas) return;
    
    const delta = opt.e.deltaY;
    let newZoom = zoom;
    
    // Zoom in/out
    if (delta > 0) {
      newZoom *= 0.9; // Zoom out
    } else {
      newZoom *= 1.1; // Zoom in
    }
    
    // Limit zoom
    newZoom = Math.min(Math.max(0.1, newZoom), 10);
    
    // Get mouse position
    const pointer = canvas.getPointer(opt.e);
    const x = pointer.x;
    const y = pointer.y;
    
    // Set zoom point
    canvas.zoomToPoint({ x, y }, newZoom);
    
    // Update state
    setZoom(newZoom);
    
    // Prevent default to stop page scrolling
    opt.e.preventDefault();
    opt.e.stopPropagation();
  };

  // Toggle pan mode
  const togglePanMode = () => {
    setPanMode(!panMode);
  };

  // Toggle grid
  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  // Toggle rulers
  const toggleRulers = () => {
    setShowRulers(!showRulers);
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!canvas) return;
    
    const newZoom = zoom * 1.2;
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    
    const newZoom = zoom * 0.8;
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleZoomReset = () => {
    if (!canvas || !containerRef.current) return;
    
    const dpi = 72;
    const width = bookFormat.withBleed.width * dpi;
    const height = bookFormat.withBleed.height * dpi;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
    
    setZoom(scale);
    canvas.setZoom(scale);
    canvas.viewportTransform = [scale, 0, 0, scale, 0, 0];
    canvas.renderAll();
  };

  // Helper functions to draw guidelines
  const drawBleedMargins = (canvas: fabric.Canvas, format: BookFormat, dpi: number) => {
    const bleed = 0.125 * dpi; // 0.125 inches = 1/8 inch bleed
    const width = format.withBleed.width * dpi;
    const height = format.withBleed.height * dpi;
    
    // Draw trim lines (where the page will be cut)
    const trimRect = new fabric.Rect({
      left: bleed,
      top: bleed,
      width: width - (2 * bleed),
      height: height - (2 * bleed),
      fill: 'transparent',
      stroke: 'red',
      strokeDashArray: [5, 5],
      strokeWidth: 1,
      selectable: false,
      evented: false,
      data: { type: 'guideline', name: 'trim' }
    });
    
    canvas.add(trimRect);
  };
  
  const drawSafetyMargins = (canvas: fabric.Canvas, format: BookFormat, dpi: number) => {
    const bleed = 0.125 * dpi; // 0.125 inches bleed
    const safety = 0.25 * dpi; // 0.25 inches safety margin
    const width = format.withBleed.width * dpi;
    const height = format.withBleed.height * dpi;
    
    // Draw safety margin
    const safetyRect = new fabric.Rect({
      left: bleed + safety,
      top: bleed + safety,
      width: width - (2 * (bleed + safety)),
      height: height - (2 * (bleed + safety)),
      fill: 'transparent',
      stroke: 'blue',
      strokeDashArray: [3, 3],
      strokeWidth: 1,
      selectable: false,
      evented: false,
      data: { type: 'guideline', name: 'safety' }
    });
    
    canvas.add(safetyRect);
  };
  
  const drawGutterArea = (canvas: fabric.Canvas, format: BookFormat, dpi: number) => {
    if (!format.isSpread) return; // Only draw gutter for spreads
    
    const bleed = 0.125 * dpi;
    const width = format.withBleed.width * dpi;
    const height = format.withBleed.height * dpi;
    
    // Draw center line for gutter
    const centerLine = new fabric.Line(
      [width / 2, 0, width / 2, height],
      {
        stroke: 'green',
        strokeDashArray: [5, 5],
        strokeWidth: 1,
        selectable: false,
        evented: false,
        data: { type: 'guideline', name: 'gutter' }
      }
    );
    
    // Add gutter area based on page count
    const gutterWidth = format.gutterWidth * dpi;
    if (gutterWidth > 0) {
      const leftGutter = width / 2 - gutterWidth / 2;
      
      const gutterRect = new fabric.Rect({
        left: leftGutter,
        top: 0,
        width: gutterWidth,
        height: height,
        fill: 'rgba(0, 255, 0, 0.1)',
        selectable: false,
        evented: false,
        data: { type: 'guideline', name: 'gutterArea' }
      });
      
      canvas.add(gutterRect);
    }
    
    // Add spine area if spine width is defined
    if (format.spineWidth && format.spineWidth > 0) {
      const spineWidth = format.spineWidth * dpi;
      const leftSpine = width / 2 - spineWidth / 2;
      
      const spineRect = new fabric.Rect({
        left: leftSpine,
        top: 0,
        width: spineWidth,
        height: height,
        fill: 'rgba(255, 0, 0, 0.1)',
        selectable: false,
        evented: false,
        data: { type: 'guideline', name: 'spine' }
      });
      
      canvas.add(spineRect);
    }
    
    canvas.add(centerLine);
  };
  
  const drawGrid = (canvas: fabric.Canvas, width: number, height: number, dpi: number) => {
    const gridSpacing = gridSize * dpi; // Convert grid size from inches to pixels
    
    // Create grid lines
    for (let i = 0; i <= width; i += gridSpacing) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: 'rgba(128, 128, 128, 0.2)',
        selectable: false,
        evented: false,
        data: { type: 'grid' }
      });
      canvas.add(line);
    }
    
    for (let i = 0; i <= height; i += gridSpacing) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: 'rgba(128, 128, 128, 0.2)',
        selectable: false,
        evented: false,
        data: { type: 'grid' }
      });
      canvas.add(line);
    }
  };
  
  const drawRulers = (canvas: fabric.Canvas, width: number, height: number, dpi: number) => {
    const rulerWidth = 20; // Ruler width in pixels
    const majorTickSpacing = 1 * dpi; // 1 inch
    const minorTickSpacing = 0.25 * dpi; // 1/4 inch
    
    // Horizontal ruler
    const hRuler = new fabric.Rect({
      left: 0,
      top: 0,
      width: width,
      height: rulerWidth,
      fill: 'rgba(220, 220, 220, 0.8)',
      selectable: false,
      evented: false,
      data: { type: 'guideline', name: 'hRuler' }
    });
    
    // Vertical ruler
    const vRuler = new fabric.Rect({
      left: 0,
      top: 0,
      width: rulerWidth,
      height: height,
      fill: 'rgba(220, 220, 220, 0.8)',
      selectable: false,
      evented: false,
      data: { type: 'guideline', name: 'vRuler' }
    });
    
    canvas.add(hRuler);
    canvas.add(vRuler);
    
    // Add ticks to horizontal ruler
    for (let i = 0; i <= width; i += minorTickSpacing) {
      const isMajorTick = i % majorTickSpacing < 0.001; // Check if it's a major tick
      const tickHeight = isMajorTick ? rulerWidth / 2 : rulerWidth / 4;
      
      const tick = new fabric.Line(
        [i, 0, i, tickHeight],
        {
          stroke: 'black',
          strokeWidth: isMajorTick ? 1 : 0.5,
          selectable: false,
          evented: false,
          data: { type: 'guideline', name: 'hTick' }
        }
      );
      
      canvas.add(tick);
      
      // Add inch labels to major ticks
      if (isMajorTick) {
        const inchValue = Math.round(i / dpi * 10) / 10; // Round to 1 decimal place
        const text = new fabric.Text(inchValue.toString(), {
          left: i + 2,
          top: tickHeight,
          fontSize: 8,
          selectable: false,
          evented: false,
          data: { type: 'guideline', name: 'hLabel' }
        });
        
        canvas.add(text);
      }
    }
    
    // Add ticks to vertical ruler
    for (let i = 0; i <= height; i += minorTickSpacing) {
      const isMajorTick = i % majorTickSpacing < 0.001; // Check if it's a major tick
      const tickWidth = isMajorTick ? rulerWidth / 2 : rulerWidth / 4;
      
      const tick = new fabric.Line(
        [0, i, tickWidth, i],
        {
          stroke: 'black',
          strokeWidth: isMajorTick ? 1 : 0.5,
          selectable: false,
          evented: false,
          data: { type: 'guideline', name: 'vTick' }
        }
      );
      
      canvas.add(tick);
      
      // Add inch labels to major ticks
      if (isMajorTick) {
        const inchValue = Math.round(i / dpi * 10) / 10; // Round to 1 decimal place
        const text = new fabric.Text(inchValue.toString(), {
          left: 2,
          top: i + 2,
          fontSize: 8,
          selectable: false,
          evented: false,
          data: { type: 'guideline', name: 'vLabel' }
        });
        
        canvas.add(text);
      }
    }
  };

  return (
    <div className="canvas-editor">
      <div className="toolbar flex justify-between items-center mb-2 p-2 bg-gray-200 rounded">
        <div className="zoom-controls flex items-center space-x-2">
          <button 
            className="p-1 bg-white rounded border border-gray-300 hover:bg-gray-100"
            onClick={handleZoomOut}
            title="Zoom Out"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button 
            className="p-1 bg-white rounded border border-gray-300 hover:bg-gray-100"
            onClick={handleZoomIn}
            title="Zoom In"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button 
            className="p-1 bg-white rounded border border-gray-300 hover:bg-gray-100 ml-2"
            onClick={handleZoomReset}
            title="Reset Zoom"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"></path>
              <path d="M3 12h18"></path>
            </svg>
          </button>
        </div>
        
        <div className="view-controls flex items-center space-x-2">
          <button 
            className={`p-1 rounded border ${panMode ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            onClick={togglePanMode}
            title="Pan Mode"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4h-2l-7 7 7 7h2v-4h6v4h2l7-7-7-7h-2v4h-6V4z"></path>
            </svg>
          </button>
          <button 
            className={`p-1 rounded border ${showGrid ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            onClick={toggleGrid}
            title="Toggle Grid"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
            </svg>
          </button>
          <button 
            className={`p-1 rounded border ${showRulers ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            onClick={toggleRulers}
            title="Toggle Rulers"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z"></path>
              <path d="M3 9h6"></path>
              <path d="M3 15h6"></path>
              <path d="M15 3v6"></path>
              <path d="M9 3v6"></path>
            </svg>
          </button>
        </div>
        
        <div className="grid-controls flex items-center space-x-2">
          <label className="text-sm">Grid Size:</label>
          <select 
            className="text-sm p-1 border border-gray-300 rounded"
            value={gridSize}
            onChange={(e) => setGridSize(parseFloat(e.target.value))}
          >
            <option value="0.125">1/8 inch</option>
            <option value="0.25">1/4 inch</option>
            <option value="0.5">1/2 inch</option>
            <option value="1">1 inch</option>
          </select>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="canvas-container relative border border-gray-300 overflow-hidden bg-white"
        style={{ height: '600px' }}
      >
        <canvas ref={canvasRef} id="canvas" />
      </div>
      
      <div className="info-panel mt-2 p-2 bg-gray-100 text-sm rounded">
        <p>
          <strong>Format:</strong> {bookFormat.name} ({bookFormat.withBleed.width}" × {bookFormat.withBleed.height}")
          {bookFormat.isSpread && bookFormat.spineWidth && (
            <span> | <strong>Spine:</strong> {bookFormat.spineWidth.toFixed(3)}"</span>
          )}
          {bookFormat.gutterWidth > 0 && (
            <span> | <strong>Gutter:</strong> {bookFormat.gutterWidth.toFixed(3)}"</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default CanvasEditor;
