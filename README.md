# Book Template Editor Documentation

## Overview

The Book Template Editor is a React-based web application that allows users to create templates for children's books. It provides a visual interface for placing images and text, with precise control over dimensions, margins, and other printing specifications based on the Lulu Book Creation Guide.

## Features

- **Canvas Editor**: Interactive canvas with zoom, pan, grid, and rulers
- **Book Format Selection**: Choose from standard book formats or create custom sizes
- **Margin Visualization**: Bleed margins, safety margins, and gutter areas
- **Image Management**: Upload images, create named placeholders, and manipulate elements
- **JSON Export**: Generate structured JSON output for use in web applications
- **Printing Specifications**: Automatic calculations for spine width and gutter based on page count

## Technical Stack

- **Frontend Framework**: React
- **Canvas Library**: Fabric.js
- **Styling**: Tailwind CSS
- **Build System**: Vite

## Project Structure

```
book-template-editor/
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   └── CanvasEditor.tsx
│   │   ├── Controls/
│   │   │   └── Controls.tsx
│   │   ├── Export/
│   │   │   └── ExportPanel.tsx
│   │   └── ImageUpload/
│   │       └── ImageUploader.tsx
│   ├── lib/
│   │   └── types.ts
│   ├── App.tsx
│   ├── fabric.d.ts
│   └── main.tsx
├── public/
├── package.json
└── tsconfig.json
```

## Core Components

### CanvasEditor

The CanvasEditor component is responsible for rendering the canvas and providing tools for manipulating it. It includes:

- Zoom and pan functionality
- Grid and rulers with customizable sizes
- Visualization of bleed margins, safety margins, and gutter areas
- Support for different book formats and dimensions

### Controls

The Controls component provides options for configuring the template:

- Book format selection (Pocketbook, Digest, A5, Royal, US Trade, etc.)
- Custom size input
- Page count adjustment with automatic gutter calculation
- Binding type selection (paperback or hardcover)
- Toggle options for various guidelines

### ImageUploader

The ImageUploader component handles adding images to the template:

- Drag and drop support
- Named placeholder creation
- Image manipulation tools (delete, duplicate, bring to front, send to back)
- List of uploaded images and placeholders

### ExportPanel

The ExportPanel component generates the JSON output:

- Template name customization
- JSON preview with syntax highlighting
- Copy to clipboard functionality
- Download as file option
- Image export alternative

## JSON Output Format

The JSON output follows this structure:

```json
{
  "id": "template-1",
  "name": "Book Template",
  "format": {
    "id": "usTrade",
    "name": "US Trade",
    "noBleed": {
      "width": 6,
      "height": 9
    },
    "withBleed": {
      "width": 6.25,
      "height": 9.25
    },
    "isSpread": false,
    "gutterWidth": 0,
    "pageCount": 60
  },
  "elements": [
    {
      "id": "element-1",
      "type": "image",
      "name": "background.jpg",
      "x": 50,
      "y": 100,
      "width": 400,
      "height": 300,
      "rotation": 0,
      "isPlaceholder": false
    },
    {
      "id": "element-2",
      "type": "placeholder",
      "name": "character",
      "x": 200,
      "y": 150,
      "width": 200,
      "height": 200,
      "rotation": 0,
      "isPlaceholder": true
    }
  ]
}
```

## Printing Specifications

The editor implements the following specifications from the Lulu Book Creation Guide:

- **Bleed Margins**: 0.125 in/3.175 mm on all sides
- **Safety Margins**: 0.25 in/6.35 mm from trim edge
- **Gutter Areas**:
  - Less than 60 pages: 0 in/0 mm
  - 61-150 pages: 0.125 in/3 mm
  - 151-400 pages: 0.5 in/13 mm
  - 400-600 pages: 0.625 in/16 mm
  - Over 600 pages: 0.75 in/19 mm
- **Spine Width Calculations**:
  - Paperback: (# of interior pages / 444) + 0.06 in
  - Hardcover: Based on page count ranges from the guide

## Integration Guide

To integrate this editor with your AI no-code tool:

1. Deploy the React application to your hosting environment
2. Use the JSON output from the editor in your web app
3. Parse the JSON to determine image and text placement
4. Generate PDFs based on the template specifications

The JSON output contains all necessary information about the template, including book dimensions, element positions, and placeholder identifications.

## Development

To run the project locally:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

To build for production:

```bash
pnpm run build
```

## Known Issues and Limitations

- TypeScript build errors may occur due to type definitions for Fabric.js
- For production use, consider implementing a server-side component for PDF generation
- Large images should be optimized before uploading to improve performance
