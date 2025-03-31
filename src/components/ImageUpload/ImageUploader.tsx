import React, { useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  canvas: fabric.Canvas | null;
  onImageAdded: (name: string, isPlaceholder: boolean) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ canvas, onImageAdded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [placeholderName, setPlaceholderName] = useState<string>('');
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{name: string, isPlaceholder: boolean}>>([]);

  // Handle file upload
  const handleFileUpload = useCallback((files: File[]) => {
    if (!files.length || !canvas) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;

      fabric.Image.fromURL(event.target.result.toString(), (img: fabric.Image) => {
        // Scale image to reasonable size if needed
        const maxDimension = 500;
        if (img.width && img.height) {
          if (img.width > maxDimension || img.height > maxDimension) {
            const scale = maxDimension / Math.max(img.width, img.height);
            img.scale(scale);
          }
        }

        // Center the image on canvas
        img.set({
          left: canvas.getWidth() / 2 - (img.getScaledWidth() || 0) / 2,
          top: canvas.getHeight() / 2 - (img.getScaledHeight() || 0) / 2,
          data: {
            name: isPlaceholder ? placeholderName : file.name,
            isPlaceholder: isPlaceholder,
            placeholderName: isPlaceholder ? placeholderName : ''
          }
        });

        // Make the image selectable and add controls
        img.setControlsVisibility({
          mt: true, // middle top
          mb: true, // middle bottom
          ml: true, // middle left
          mr: true, // middle right
          bl: true, // bottom left
          br: true, // bottom right
          tl: true, // top left
          tr: true, // top right
          mtr: true, // middle top rotation
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Add to uploaded images list
        const imageName = isPlaceholder ? placeholderName : file.name;
        setUploadedImages(prev => [...prev, { name: imageName, isPlaceholder: isPlaceholder }]);

        // Notify parent component
        onImageAdded(imageName, isPlaceholder);

        // Reset placeholder state if it was set
        if (isPlaceholder) {
          setIsPlaceholder(false);
          setPlaceholderName('');
        }
      });
    };

    reader.readAsDataURL(file);
  }, [canvas, isPlaceholder, placeholderName, onImageAdded]);

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    onDrop: handleFileUpload
  });

  // Add placeholder
  const handleAddPlaceholder = () => {
    if (!canvas || !placeholderName) return;

    // Create a placeholder rectangle
    const placeholder = new fabric.Rect({
      width: 200,
      height: 200,
      fill: 'rgba(200, 200, 200, 0.5)',
      stroke: 'rgba(0, 0, 0, 0.5)',
      strokeDashArray: [5, 5],
      strokeWidth: 2,
      left: canvas.getWidth() / 2 - 100,
      top: canvas.getHeight() / 2 - 100,
      data: {
        name: placeholderName,
        isPlaceholder: true,
        placeholderName: placeholderName
      }
    });

    // Add placeholder text
    const text = new fabric.Text(placeholderName, {
      fontSize: 16,
      fill: 'rgba(0, 0, 0, 0.7)',
      left: 10,
      top: 10,
      selectable: false
    });

    // Group the placeholder and text
    const group = new fabric.Group([placeholder, text], {
      left: canvas.getWidth() / 2 - 100,
      top: canvas.getHeight() / 2 - 100,
      data: {
        name: placeholderName,
        isPlaceholder: true,
        placeholderName: placeholderName
      }
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();

    // Add to uploaded images list
    setUploadedImages(prev => [...prev, { name: placeholderName, isPlaceholder: true }]);

    // Notify parent component
    onImageAdded(placeholderName, true);

    // Reset placeholder state
    setPlaceholderName('');
  };

  // Delete selected object
  const handleDeleteSelected = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      
      // Remove from uploaded images list if it's there
      if (activeObject.data?.name) {
        setUploadedImages(prev => prev.filter(img => img.name !== activeObject.data.name));
      }
    }
  };

  // Bring selected object to front
  const handleBringToFront = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.bringToFront();
      canvas.renderAll();
    }
  };

  // Send selected object to back
  const handleSendToBack = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.sendToBack();
      canvas.renderAll();
    }
  };

  // Duplicate selected object
  const handleDuplicate = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (activeObject.left || 0) + 20,
          top: (activeObject.top || 0) + 20,
          evented: true,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        
        // Add to uploaded images list if it has a name
        if (activeObject.data?.name) {
          setUploadedImages(prev => [...prev, { 
            name: `Copy of ${activeObject.data.name}`, 
            isPlaceholder: !!activeObject.data.isPlaceholder 
          }]);
        }
      });
    }
  };

  return (
    <div className="image-uploader p-4 bg-white border border-gray-300 rounded-md">
      <h3 className="text-lg font-medium mb-3">Add Images</h3>
      
      {/* Drag & Drop Zone */}
      <div 
        {...getRootProps()} 
        className={`mb-4 border-2 border-dashed p-4 text-center rounded-md cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the image here...</p>
        ) : (
          <div>
            <p className="mb-2">Drag & drop an image here, or click to select</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="button"
            >
              Select Image
            </button>
          </div>
        )}
      </div>

      {/* Placeholder Creator */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder Name
        </label>
        <div className="flex">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={placeholderName}
            onChange={(e) => setPlaceholderName(e.target.value)}
            placeholder="Enter placeholder name"
          />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleAddPlaceholder}
            disabled={!placeholderName}
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      {/* Mark as Placeholder Option */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="isPlaceholder"
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          checked={isPlaceholder}
          onChange={(e) => setIsPlaceholder(e.target.checked)}
        />
        <label htmlFor="isPlaceholder" className="ml-2 block text-sm text-gray-700">
          Mark uploaded image as placeholder
        </label>
      </div>

      {/* Image Manipulation Tools */}
      <div className="mb-4 p-3 bg-gray-100 rounded-md">
        <h4 className="text-sm font-medium mb-2">Image Tools</h4>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleDeleteSelected}
            title="Delete Selected"
            type="button"
          >
            Delete
          </button>
          <button
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={handleDuplicate}
            title="Duplicate Selected"
            type="button"
          >
            Duplicate
          </button>
          <button
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleBringToFront}
            title="Bring to Front"
            type="button"
          >
            Bring Forward
          </button>
          <button
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleSendToBack}
            title="Send to Back"
            type="button"
          >
            Send Back
          </button>
        </div>
      </div>

      {/* Uploaded Images List */}
      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
            <ul className="divide-y divide-gray-200">
              {uploadedImages.map((img, index) => (
                <li key={index} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${img.isPlaceholder ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                    <span className="text-sm truncate max-w-[150px]" title={img.name}>
                      {img.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {img.isPlaceholder ? 'Placeholder' : 'Image'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
