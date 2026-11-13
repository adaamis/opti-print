<div align="center">

# OptiPrint

**High-performance print imposition and sheet cutting optimization suite.**

[Live Demo](https://adaamis.github.io/opti-print/) &bull; [Report Bug](https://github.com/adaamis/opti-print/issues) &bull; [Request Feature](https://github.com/adaamis/opti-print/issues)

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/github/actions/workflow/status/adaamis/opti-print/deploy.yml?branch=main&style=flat-square&label=Deploy" alt="Deploy Status" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

</div>

---

## Overview

OptiPrint is an analytical sheet-cutting and print imposition tool designed for digital print houses, commercial printers, packaging converters, and designers. It calculates optimal orthogonal and mixed-nesting layouts to maximize raw sheet yield, lower substrate waste, and compute real-time cutting and production metrics.

## Key Capabilities

### 1. Rapid Single-Item Imposition ("How Many Fit?")
- Computes layout density across three distinct nesting strategies simultaneously:
  - **Pure Horizontal**: Strict alignment along the primary sheet axis.
  - **Pure Vertical**: Strict 90-degree orthogonal orientation.
  - **Mixed Nesting**: Algorithmic orientation mixing to reclaim margin remnants and off-cuts.
- Instant identification of the highest-yield configuration with waste percentage calculations.

### 2. Multi-Item Batch Packer
- Resolves composite print runs with disparate item dimensions, quantities, and orientation constraints.
- Multi-sheet sequential packing engine with global utilization reporting.
- Produces production summaries tracking target quantities vs. actual sheet yields.

### 3. Substrate & Sheet Configuration
- Preconfigured standard commercial paper profiles:
  - ISO Standard: A4 (210 &times; 297 mm), A3 (297 &times; 420 mm), SRA3 (320 &times; 450 mm), A3+ (329 &times; 483 mm)
  - Full Industrial Formats: BB (660 &times; 960 mm), AA (760 &times; 1120 mm)
- Custom format manager with persistent browser storage (`localStorage`).
- Dual metric unit system: Millimeters (mm) and Centimeters (cm) with bidirectional synchronization.
- Granular gripper (margin) and cutting gutter (spacing) parameter controls.

### 4. Interactive Vector Canvas & Print Preview
- Real-time scalable canvas with metric dimensional grid.
- Sheet-by-sheet navigation with paging and item distribution inspection.
- Dedicated `@media print` style layer for producing clean, clutter-free job tickets directly from the browser.

### 5. Production-Ready 1:1 SVG Export
- Generates standards-compliant SVG files with physical millimeter units (`1:1 metric scale`).
- Direct import compatibility with prepress software: Adobe Illustrator, CorelDRAW, Inkscape, RIP controllers, and digital cutting tables.
- Hierarchical SVG layering: sheet boundary, gripper safety limits, labeled parts, and dimensional annotations.

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Bundler / Tooling** | Vite 8, Vitest |
| **CI / CD** | GitHub Actions & GitHub Pages |

---

## Getting Started

### Prerequisites

- Node.js (version 18 or later)
- npm or compatible package manager

### Installation

```bash
git clone https://github.com/adaamis/opti-print.git
cd opti-print
npm install
```

### Development Server

Start the local development server with Hot Module Replacement:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173/opti-print/`.

### Testing

Run the test suite via Vitest:

```bash
npm test
```

### Static Type Checking

Validate TypeScript signatures:

```bash
npm run typecheck
```

### Production Build

Compile and bundle the production assets into `dist/`:

```bash
npm run build
npm run preview
```

---

## Project Structure

```
opti-print/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated CI/CD pipeline for GitHub Pages
├── src/
│   ├── components/             # React presentation and control panels
│   │   ├── MetricsBar.tsx      # Yield, waste, and item count metrics
│   │   ├── QuickModePanel.tsx  # Rapid single-dimension calculator
│   │   ├── ItemListPanel.tsx   # Multi-item inventory and demand table
│   │   ├── SheetConfigPanel.tsx# Sheet dimensions, margins, and gutters
│   │   └── SheetVisualizer.tsx # Canvas renderer and SVG export triggers
│   ├── engine/                 # Pure calculation and optimization logic
│   │   ├── packer.ts           # Guillotine and mixed-nesting algorithms
│   │   ├── pricing.ts          # Substrate and finishing cost computations
│   │   └── recommender.ts      # Automated sheet recommendation engine
│   ├── constants/              # Substrate specifications and preset catalogs
│   ├── types/                  # TypeScript interface and domain definitions
│   └── utils/                  # Units conversion, SVG generation, and storage
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## License

This project is licensed under the [MIT License](LICENSE).
