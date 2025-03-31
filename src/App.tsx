import { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import './App.css';
import CanvasEditor from './components/Canvas/CanvasEditor';
import Controls from './components/Controls/Controls';
import ImageUploader from './components/ImageUpload/ImageUploader';
import ExportPanel from './components/Export/ExportPanel';
import { BookFormat, BOOK_FORMATS, Template, TemplateElement } from './lib/types';

function App() {
  const [bookFormat, setBookFormat] = useState<BookFormat>(BOOK_FORMATS.usTrade);
  const [showBleed, setShowBleed] = useState<boolean>(true);
  const [showGutter, setShowGutter] = useState<boolean>(true);
  const [showSafety, setShowSafety] = useState<boolean>(true);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const canvasRef = useRef<fabric.Canvas | null>(null);

  // Initialize canvas
  useEffect(() => {
    const fabricCanvas = new fabric.Canvas('canvas', {
      backgroundColor: '#f0f0f0',
      preserveObjectStacking: true,
      selection: true,
    });
    
    canvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);
    
    // Cleanup on unmount
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update template when elements or format changes
  useEffect(() => {
    if (bookFormat) {
      setTemplate({
        id: 'template-1',
        name: 'Book Template',
        format: bookFormat,
        elements: elements
      });
    }
  }, [bookFormat, elements]);

  // Handle format change from controls
  const handleFormatChange = (format: BookFormat) => {
    setBookFormat(format);
  };

  // Handle image added from uploader
  const handleImageAdded = (name: string, isPlaceholder: boolean) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    // Create a new element from the active object
    const element: TemplateElement = {
      id: `element-${Date.now()}`,
      type: isPlaceholder ? 'placeholder' : 'image',
      name: name,
      x: activeObject.left || 0,
      y: activeObject.top || 0,
      width: activeObject.getScaledWidth() || 100,
      height: activeObject.getScaledHeight() || 100,
      rotation: activeObject.angle || 0,
      isPlaceholder: isPlaceholder,
    };
    
    // Add to elements array
    setElements(prev => [...prev, element]);
  };

  // Handle export
  const handleExport = () => {
    if (!template) return;
    
    // Create a JSON string
    const jsonData = JSON.stringify(template, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle page count change
  const handlePageCountChange = (count: number) => {
    // This is handled within the Controls component
  };

  return (
    <div className="app min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Book Template Editor</h1>
      </header>
      
      <main className="container mx-auto p-4">
        <Controls 
          onFormatChange={handleFormatChange}
          onToggleBleed={setShowBleed}
          onToggleGutter={setShowGutter}
          onToggleSafety={setShowSafety}
          onPageCountChange={handlePageCountChange}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <div className="lg:col-span-3">
            <div className="bg-white p-4 border border-gray-300 rounded-md shadow-sm">
              <CanvasEditor 
                bookFormat={bookFormat}
                showBleed={showBleed}
                showGutter={showGutter}
                showSafety={showSafety}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <ImageUploader 
              canvas={canvas}
              onImageAdded={handleImageAdded}
            />
            
            <ExportPanel 
              canvas={canvas}
              template={template}
              onExport={handleExport}
            />
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 border-t border-gray-300 mt-8">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          <p>Book Template Editor - Based on Lulu Book Creation Guide specifications</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
