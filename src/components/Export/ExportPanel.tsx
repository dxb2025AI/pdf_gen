import React, { useState, useEffect } from 'react';
import { Template, TemplateElement } from '../../lib/types';
import { fabric } from 'fabric';

interface ExportPanelProps {
  canvas: fabric.Canvas | null;
  template: Template | null;
  onExport: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ canvas, template, onExport }) => {
  const [jsonOutput, setJsonOutput] = useState<string>('{}');
  const [templateName, setTemplateName] = useState<string>('My Book Template');
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf'>('json');

  // Update JSON preview when template changes
  useEffect(() => {
    if (template) {
      // Create a copy of the template with the current name
      const exportTemplate = {
        ...template,
        name: templateName,
        elements: getElementsFromCanvas()
      };
      
      setJsonOutput(JSON.stringify(exportTemplate, null, 2));
    }
  }, [template, templateName, canvas]);

  // Get current elements from canvas
  const getElementsFromCanvas = (): TemplateElement[] => {
    if (!canvas) return [];
    
    const elements: TemplateElement[] = [];
    
    canvas.getObjects().forEach((obj: fabric.Object, index: number) => {
      // Skip guidelines, grid, and rulers
      if (obj.data?.type === 'guideline' || obj.data?.type === 'grid') {
        return;
      }
      
      // Extract element data
      if (obj.data) {
        const element: TemplateElement = {
          id: `element-${index}`,
          type: obj.data.isPlaceholder ? 'placeholder' : 'image',
          name: obj.data.name || `Element ${index}`,
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.getScaledWidth() || 100,
          height: obj.getScaledHeight() || 100,
          rotation: obj.angle || 0,
          isPlaceholder: !!obj.data.isPlaceholder,
        };
        
        elements.push(element);
      }
    });
    
    return elements;
  };

  // Handle export button click
  const handleExport = () => {
    if (!template) return;
    
    // Update template with current elements and name
    const exportTemplate = {
      ...template,
      name: templateName,
      elements: getElementsFromCanvas()
    };
    
    // Create a JSON string
    const jsonData = JSON.stringify(exportTemplate, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Notify parent component
    onExport();
  };

  // Handle export as PDF (placeholder for future implementation)
  const handleExportPDF = () => {
    if (!canvas) return;
    
    // Hide guidelines for PDF export
    const guidelineObjects = canvas.getObjects().filter((obj: fabric.Object) => 
      obj.data?.type === 'guideline' || obj.data?.type === 'grid'
    );
    
    // Store visibility state
    const visibilityState = guidelineObjects.map((obj: fabric.Object) => obj.visible);
    
    // Hide guidelines
    guidelineObjects.forEach((obj: fabric.Object) => obj.set({ visible: false }));
    canvas.renderAll();
    
    // Create a data URL of the canvas
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0
    });
    
    // Create a link to download the image
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Restore visibility state
    guidelineObjects.forEach((obj: fabric.Object, index: number) => {
      obj.set({ visible: visibilityState[index] });
    });
    canvas.renderAll();
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      alert('JSON copied to clipboard!');
    });
  };

  return (
    <div className="export-panel p-4 bg-white border border-gray-300 rounded-md">
      <h3 className="text-lg font-medium mb-3">Export Template</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Name
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Enter template name"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Export Format
        </label>
        <div className="flex space-x-2">
          <button
            className={`flex-1 px-3 py-2 rounded-md ${
              exportFormat === 'json' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setExportFormat('json')}
          >
            JSON
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded-md ${
              exportFormat === 'pdf' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setExportFormat('pdf')}
          >
            Image
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <button
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          onClick={exportFormat === 'json' ? handleExport : handleExportPDF}
          disabled={!template}
        >
          {exportFormat === 'json' ? 'Export JSON' : 'Export as Image'}
        </button>
      </div>
      
      {exportFormat === 'json' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">JSON Preview:</h4>
            <button
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={handleCopyJson}
            >
              Copy
            </button>
          </div>
          <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">{jsonOutput}</pre>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>This JSON output can be used in your web app to recreate this template.</p>
            <p>It contains all book specifications, dimensions, and element positions.</p>
          </div>
        </>
      )}
      
      {exportFormat === 'pdf' && (
        <div className="mt-4 text-xs text-gray-500">
          <p>The image export will create a PNG file of your template.</p>
          <p>Guidelines and rulers will be hidden in the exported image.</p>
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
