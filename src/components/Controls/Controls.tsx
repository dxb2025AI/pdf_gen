import React, { useState } from 'react';
import { BookFormat, BOOK_FORMATS, getGutterWidth, calculatePaperbackSpineWidth, calculateHardcoverSpineWidth } from '../../lib/types';

interface ControlsProps {
  onFormatChange: (format: BookFormat) => void;
  onToggleBleed: (show: boolean) => void;
  onToggleGutter: (show: boolean) => void;
  onToggleSafety: (show: boolean) => void;
  onPageCountChange: (count: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  onFormatChange,
  onToggleBleed,
  onToggleGutter,
  onToggleSafety,
  onPageCountChange
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('usTrade');
  const [pageCount, setPageCount] = useState<number>(60);
  const [showBleed, setShowBleed] = useState<boolean>(true);
  const [showGutter, setShowGutter] = useState<boolean>(true);
  const [showSafety, setShowSafety] = useState<boolean>(true);
  const [isSpread, setIsSpread] = useState<boolean>(false);
  const [bindingType, setBindingType] = useState<'paperback' | 'hardcover'>('paperback');
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Update format when any related parameter changes
  const updateFormat = () => {
    // Start with the selected format or create a custom one
    let format: BookFormat;
    
    if (useCustomSize) {
      // Create a custom format based on user dimensions
      format = {
        id: 'custom',
        name: 'Custom Size',
        noBleed: { 
          width: customWidth, 
          height: customHeight 
        },
        withBleed: { 
          width: customWidth + 0.25, // Add bleed (0.125" on each side)
          height: customHeight + 0.25 
        },
        isSpread: isSpread,
        gutterWidth: getGutterWidth(pageCount),
        pageCount: pageCount
      };
    } else {
      // Use a predefined format
      format = { ...BOOK_FORMATS[selectedFormat] };
    }
    
    // Update gutter width based on page count
    format.gutterWidth = getGutterWidth(pageCount);
    format.pageCount = pageCount;
    
    // Calculate spine width if it's a spread
    if (format.isSpread) {
      if (bindingType === 'paperback') {
        format.spineWidth = calculatePaperbackSpineWidth(pageCount);
      } else {
        format.spineWidth = calculateHardcoverSpineWidth(pageCount);
      }
    }
    
    onFormatChange(format);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formatId = e.target.value;
    setSelectedFormat(formatId);
    setUseCustomSize(false);
    
    // Update spread state based on the selected format
    setIsSpread(BOOK_FORMATS[formatId].isSpread);
    
    // Create a copy of the selected format
    const format = { ...BOOK_FORMATS[formatId] };
    
    // Update gutter width based on page count
    format.gutterWidth = getGutterWidth(pageCount);
    
    // Calculate spine width if it's a spread
    if (format.isSpread) {
      format.pageCount = pageCount;
      format.spineWidth = bindingType === 'paperback' 
        ? calculatePaperbackSpineWidth(pageCount)
        : calculateHardcoverSpineWidth(pageCount);
    }
    
    onFormatChange(format);
  };

  const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 0;
    setPageCount(count);
    onPageCountChange(count);
    
    // Update the format with new gutter width based on page count
    let format: BookFormat;
    
    if (useCustomSize) {
      format = {
        id: 'custom',
        name: 'Custom Size',
        noBleed: { 
          width: customWidth, 
          height: customHeight 
        },
        withBleed: { 
          width: customWidth + 0.25,
          height: customHeight + 0.25 
        },
        isSpread: isSpread,
        gutterWidth: getGutterWidth(count),
        pageCount: count
      };
    } else {
      format = { ...BOOK_FORMATS[selectedFormat] };
    }
    
    format.gutterWidth = getGutterWidth(count);
    format.pageCount = count;
    
    // Calculate spine width if it's a spread
    if (format.isSpread) {
      format.spineWidth = bindingType === 'paperback' 
        ? calculatePaperbackSpineWidth(count)
        : calculateHardcoverSpineWidth(count);
    }
    
    onFormatChange(format);
  };

  const handleToggleBleed = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowBleed(e.target.checked);
    onToggleBleed(e.target.checked);
  };

  const handleToggleGutter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowGutter(e.target.checked);
    onToggleGutter(e.target.checked);
  };

  const handleToggleSafety = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSafety(e.target.checked);
    onToggleSafety(e.target.checked);
  };

  const handleToggleSpread = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSpreadValue = e.target.checked;
    setIsSpread(isSpreadValue);
    
    // Update format based on spread change
    if (useCustomSize) {
      const format = {
        id: 'custom',
        name: 'Custom Size',
        noBleed: { 
          width: customWidth, 
          height: customHeight 
        },
        withBleed: { 
          width: customWidth + 0.25,
          height: customHeight + 0.25 
        },
        isSpread: isSpreadValue,
        gutterWidth: getGutterWidth(pageCount),
        pageCount: pageCount
      };
      
      if (isSpreadValue) {
        format.spineWidth = bindingType === 'paperback' 
          ? calculatePaperbackSpineWidth(pageCount)
          : calculateHardcoverSpineWidth(pageCount);
      }
      
      onFormatChange(format);
    } else {
      // Switch between single page and spread formats
      if (isSpreadValue) {
        // Find the corresponding spread format
        const spreadFormatId = `${selectedFormat}Spread`;
        if (BOOK_FORMATS[spreadFormatId]) {
          setSelectedFormat(spreadFormatId);
          const format = { ...BOOK_FORMATS[spreadFormatId] };
          format.gutterWidth = getGutterWidth(pageCount);
          format.pageCount = pageCount;
          format.spineWidth = bindingType === 'paperback' 
            ? calculatePaperbackSpineWidth(pageCount)
            : calculateHardcoverSpineWidth(pageCount);
          onFormatChange(format);
        }
      } else {
        // Switch back to single page format
        const singleFormatId = selectedFormat.replace('Spread', '');
        if (BOOK_FORMATS[singleFormatId]) {
          setSelectedFormat(singleFormatId);
          onFormatChange(BOOK_FORMATS[singleFormatId]);
        }
      }
    }
  };

  const handleBindingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'paperback' | 'hardcover';
    setBindingType(type);
    
    // Update spine width calculation based on binding type
    if (isSpread) {
      let format: BookFormat;
      
      if (useCustomSize) {
        format = {
          id: 'custom',
          name: 'Custom Size',
          noBleed: { 
            width: customWidth, 
            height: customHeight 
          },
          withBleed: { 
            width: customWidth + 0.25,
            height: customHeight + 0.25 
          },
          isSpread: true,
          gutterWidth: getGutterWidth(pageCount),
          pageCount: pageCount
        };
      } else {
        format = { ...BOOK_FORMATS[selectedFormat] };
      }
      
      format.pageCount = pageCount;
      format.spineWidth = type === 'paperback' 
        ? calculatePaperbackSpineWidth(pageCount)
        : calculateHardcoverSpineWidth(pageCount);
      onFormatChange(format);
    }
  };

  const handleCustomWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseFloat(e.target.value) || 0;
    setCustomWidth(width);
    
    if (useCustomSize) {
      updateFormat();
    }
  };

  const handleCustomHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseFloat(e.target.value) || 0;
    setCustomHeight(height);
    
    if (useCustomSize) {
      updateFormat();
    }
  };

  const handleToggleCustomSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const useCustom = e.target.checked;
    setUseCustomSize(useCustom);
    
    if (useCustom && customWidth === 0 && customHeight === 0) {
      // Initialize with current format dimensions if switching to custom
      const currentFormat = BOOK_FORMATS[selectedFormat];
      setCustomWidth(currentFormat.noBleed.width);
      setCustomHeight(currentFormat.noBleed.height);
      
      // Create a custom format based on the current format
      const format = {
        id: 'custom',
        name: 'Custom Size',
        noBleed: { 
          width: currentFormat.noBleed.width, 
          height: currentFormat.noBleed.height 
        },
        withBleed: { 
          width: currentFormat.noBleed.width + 0.25,
          height: currentFormat.noBleed.height + 0.25 
        },
        isSpread: isSpread,
        gutterWidth: getGutterWidth(pageCount),
        pageCount: pageCount
      };
      
      if (isSpread) {
        format.spineWidth = bindingType === 'paperback' 
          ? calculatePaperbackSpineWidth(pageCount)
          : calculateHardcoverSpineWidth(pageCount);
      }
      
      onFormatChange(format);
    } else if (!useCustom) {
      // Switch back to selected format
      const format = { ...BOOK_FORMATS[selectedFormat] };
      format.gutterWidth = getGutterWidth(pageCount);
      format.pageCount = pageCount;
      
      if (format.isSpread) {
        format.spineWidth = bindingType === 'paperback' 
          ? calculatePaperbackSpineWidth(pageCount)
          : calculateHardcoverSpineWidth(pageCount);
      }
      
      onFormatChange(format);
    }
  };

  const handleTogglePreviewMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewMode(e.target.checked);
    
    // Hide all guidelines in preview mode
    if (e.target.checked) {
      onToggleBleed(false);
      onToggleGutter(false);
      onToggleSafety(false);
    } else {
      onToggleBleed(showBleed);
      onToggleGutter(showGutter);
      onToggleSafety(showSafety);
    }
  };

  // Calculate spine width for display
  const getSpineWidth = (): number => {
    if (bindingType === 'paperback') {
      return calculatePaperbackSpineWidth(pageCount);
    } else {
      return calculateHardcoverSpineWidth(pageCount);
    }
  };

  return (
    <div className="controls p-4 bg-gray-100 border-b border-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Format Selection */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Book Format</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedFormat}
            onChange={handleFormatChange}
            disabled={useCustomSize}
          >
            <optgroup label="Interior Pages">
              {Object.entries(BOOK_FORMATS)
                .filter(([_, format]) => !format.isSpread)
                .map(([formatId, format]) => (
                  <option key={formatId} value={formatId}>{format.name} ({format.noBleed.width}" × {format.noBleed.height}")</option>
                ))
              }
            </optgroup>
            <optgroup label="Cover Spreads">
              {Object.entries(BOOK_FORMATS)
                .filter(([_, format]) => format.isSpread)
                .map(([formatId, format]) => (
                  <option key={formatId} value={formatId}>{format.name} ({format.noBleed.width}" × {format.noBleed.height}")</option>
                ))
              }
            </optgroup>
          </select>
        </div>
        
        {/* Custom Size Toggle */}
        <div className="form-group flex items-center">
          <input 
            type="checkbox" 
            id="useCustomSize" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={useCustomSize}
            onChange={handleToggleCustomSize}
          />
          <label htmlFor="useCustomSize" className="ml-2 block text-sm text-gray-700">Use Custom Size</label>
        </div>
        
        {/* Page Count */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Count</label>
          <input 
            type="number" 
            min="24"
            max="800"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={pageCount}
            onChange={handlePageCountChange}
          />
        </div>
      </div>
      
      {/* Custom Size Inputs (conditionally rendered) */}
      {useCustomSize && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Width (inches)</label>
            <input 
              type="number" 
              step="0.125"
              min="3"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={customWidth}
              onChange={handleCustomWidthChange}
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
            <input 
              type="number" 
              step="0.125"
              min="3"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={customHeight}
              onChange={handleCustomHeightChange}
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Binding Type */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Binding Type</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={bindingType}
            onChange={handleBindingTypeChange}
          >
            <option value="paperback">Paperback</option>
            <option value="hardcover">Hardcover</option>
          </select>
        </div>
        
        {/* Preview Mode */}
        <div className="form-group flex items-center">
          <input 
            type="checkbox" 
            id="previewMode" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={previewMode}
            onChange={handleTogglePreviewMode}
          />
          <label htmlFor="previewMode" className="ml-2 block text-sm text-gray-700">Preview Mode (hide guidelines)</label>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4">
        {/* Visualization Toggles */}
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="showBleed" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={showBleed}
            onChange={handleToggleBleed}
            disabled={previewMode}
          />
          <label htmlFor="showBleed" className="ml-2 block text-sm text-gray-700">Show Bleed Margins</label>
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="showSafety" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={showSafety}
            onChange={handleToggleSafety}
            disabled={previewMode}
          />
          <label htmlFor="showSafety" className="ml-2 block text-sm text-gray-700">Show Safety Margins</label>
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="showGutter" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={showGutter}
            onChange={handleToggleGutter}
            disabled={previewMode}
          />
          <label htmlFor="showGutter" className="ml-2 block text-sm text-gray-700">Show Gutter Area</label>
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="isSpread" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={isSpread}
            onChange={handleToggleSpread}
            disabled={!useCustomSize && !selectedFormat.includes('Spread')}
          />
          <label htmlFor="isSpread" className="ml-2 block text-sm text-gray-700">Cover Spread</label>
        </div>
      </div>
      
      {/* Specifications Display */}
      {isSpread && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Cover Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <p className="text-sm text-blue-800">
              <strong>Spine Width:</strong> {getSpineWidth().toFixed(3)} inches
            </p>
            <p className="text-sm text-blue-800">
              <strong>Gutter Width:</strong> {getGutterWidth(pageCount).toFixed(3)} inches
            </p>
            <p className="text-sm text-blue-800">
              <strong>Bleed Margin:</strong> 0.125 inches
            </p>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {bindingType === 'paperback' 
              ? 'Paperback spine width = (page count ÷ 444) + 0.06 inches' 
              : 'Hardcover spine width based on Lulu specifications table'}
          </p>
        </div>
      )}
      
      {/* Format Information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Format Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p className="text-sm text-gray-600">
            <strong>Trim Size:</strong> {useCustomSize 
              ? `${customWidth}" × ${customHeight}"`
              : `${BOOK_FORMATS[selectedFormat].noBleed.width}" × ${BOOK_FORMATS[selectedFormat].noBleed.height}"`}
          </p>
          <p className="text-sm text-gray-600">
            <strong>With Bleed:</strong> {useCustomSize 
              ? `${(customWidth + 0.25).toFixed(3)}" × ${(customHeight + 0.25).toFixed(3)}"`
              : `${BOOK_FORMATS[selectedFormat].withBleed.width}" × ${BOOK_FORMATS[selectedFormat].withBleed.height}"`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Controls;
