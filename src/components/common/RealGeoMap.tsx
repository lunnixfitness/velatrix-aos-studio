import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Globe, 
  Layers, 
  Plus, 
  Minus, 
  RotateCcw, 
  Compass, 
  Maximize2, 
  Eye, 
  MapPin, 
  Navigation 
} from 'lucide-react';

export type MapTileMode = 'dark' | 'satellite' | 'streets';

interface RealGeoMapProps {
  initialCenter?: [number, number]; // [lat, lng]
  initialZoom?: number; // 3 to 14
  minZoom?: number;
  maxZoom?: number;
  height?: string | number;
  className?: string;
  showLayerToggle?: boolean;
  showControls?: boolean;
  showBorders?: boolean;
  showRoads?: boolean;
  showCityNames?: boolean;
  selectedMarkerId?: string;
  onMapClick?: (lat: number, lng: number) => void;
  children?: React.ReactNode | ((helpers: { project: (lat: number, lng: number) => { x: number; y: number; inBounds: boolean } }) => React.ReactNode);
}

// Major cities in Brazil with real coordinates for map labels
export const BRAZIL_MAJOR_CITIES = [
  { name: 'São Paulo', state: 'SP', lat: -23.5505, lng: -46.6333, pop: 'Capital', tier: 1 },
  { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lng: -43.1729, pop: 'Capital', tier: 1 },
  { name: 'Brasília', state: 'DF', lat: -15.7975, lng: -47.8919, pop: 'Federal', tier: 1 },
  { name: 'Belo Horizonte', state: 'MG', lat: -19.9167, lng: -43.9345, pop: 'Capital', tier: 1 },
  { name: 'Curitiba', state: 'PR', lat: -25.4284, lng: -49.2733, pop: 'Capital', tier: 1 },
  { name: 'Porto Alegre', state: 'RS', lat: -30.0346, lng: -51.2177, pop: 'Capital', tier: 1 },
  { name: 'Salvador', state: 'BA', lat: -12.9777, lng: -38.5016, pop: 'Capital', tier: 1 },
  { name: 'Recife', state: 'PE', lat: -8.0476, lng: -34.8770, pop: 'Capital', tier: 2 },
  { name: 'Fortaleza', state: 'CE', lat: -3.7172, lng: -38.5433, pop: 'Capital', tier: 2 },
  { name: 'Manaus', state: 'AM', lat: -3.1190, lng: -60.0217, pop: 'Capital', tier: 1 },
  { name: 'Belém', state: 'PA', lat: -1.4558, lng: -48.4902, pop: 'Capital', tier: 2 },
  { name: 'Goiânia', state: 'GO', lat: -16.6869, lng: -49.2648, pop: 'Capital', tier: 2 },
  { name: 'Cuiabá', state: 'MT', lat: -15.6014, lng: -56.0979, pop: 'Capital', tier: 2 },
  { name: 'Campo Grande', state: 'MS', lat: -20.4697, lng: -54.6201, pop: 'Capital', tier: 2 },
  { name: 'Florianópolis', state: 'SC', lat: -27.5954, lng: -48.5480, pop: 'Capital', tier: 2 },
  { name: 'Vitória', state: 'ES', lat: -20.3155, lng: -40.3128, pop: 'Capital', tier: 2 },
  { name: 'Campinas', state: 'SP', lat: -22.9099, lng: -47.0626, pop: 'Polo Tech', tier: 2 },
  { name: 'Santos', state: 'SP', lat: -23.9608, lng: -46.3336, pop: 'Porto', tier: 2 },
  { name: 'Joinville', state: 'SC', lat: -26.3044, lng: -48.8487, pop: 'Industrial', tier: 2 },
  { name: 'Rondonópolis', state: 'MT', lat: -16.4674, lng: -54.6368, pop: 'Agro', tier: 2 },
  { name: 'Anápolis', state: 'GO', lat: -16.3268, lng: -48.9534, pop: 'Farma/Log', tier: 2 },
  { name: 'São José dos Campos', state: 'SP', lat: -23.2237, lng: -45.9009, pop: 'Aeroespacial', tier: 2 }
];

// Major logistics corridors (real geographic paths across Brazil)
export const BRAZIL_LOGISTICS_HIGHWAYS = [
  // BR-116 (Dutra / Régis Bittencourt: POA - CWB - SP - RJ - NE)
  [
    { lat: -30.03, lng: -51.21, name: 'Porto Alegre' },
    { lat: -29.17, lng: -51.52, name: 'Caxias do Sul' },
    { lat: -26.30, lng: -48.84, name: 'Joinville' },
    { lat: -25.42, lng: -49.27, name: 'Curitiba' },
    { lat: -24.71, lng: -47.55, name: 'Registro' },
    { lat: -23.55, lng: -46.63, name: 'São Paulo' },
    { lat: -23.22, lng: -45.90, name: 'São José dos Campos' },
    { lat: -22.52, lng: -44.10, name: 'Volta Redonda' },
    { lat: -22.90, lng: -43.17, name: 'Rio de Janeiro' },
    { lat: -21.75, lng: -41.32, name: 'Campos dos Goytacazes' },
    { lat: -18.85, lng: -41.94, name: 'Gov. Valadares' },
    { lat: -14.86, lng: -40.84, name: 'Vitória da Conquista' },
    { lat: -12.26, lng: -38.96, name: 'Feira de Santana' },
    { lat: -8.04, lng: -34.87, name: 'Recife' },
    { lat: -3.71, lng: -38.54, name: 'Fortaleza' }
  ],
  // BR-050 / BR-040 (SP - Campinas - Triângulo Mineiro - Brasília)
  [
    { lat: -23.55, lng: -46.63, name: 'São Paulo' },
    { lat: -22.90, lng: -47.06, name: 'Campinas' },
    { lat: -21.17, lng: -47.81, name: 'Ribeirão Preto' },
    { lat: -19.74, lng: -47.93, name: 'Uberaba' },
    { lat: -18.91, lng: -48.27, name: 'Uberlândia' },
    { lat: -17.74, lng: -48.62, name: 'Caldas Novas' },
    { lat: -16.68, lng: -49.26, name: 'Goiânia' },
    { lat: -16.32, lng: -48.95, name: 'Anápolis' },
    { lat: -15.79, lng: -47.89, name: 'Brasília' }
  ],
  // BR-163 / BR-364 (Agro Corridor MT - GO - SP / Portos)
  [
    { lat: -11.86, lng: -55.50, name: 'Sinop' },
    { lat: -13.06, lng: -55.91, name: 'Lucas do Rio Verde' },
    { lat: -13.55, lng: -56.78, name: 'Nova Mutum' },
    { lat: -15.60, lng: -56.09, name: 'Cuiabá' },
    { lat: -16.46, lng: -54.63, name: 'Rondonópolis' },
    { lat: -19.39, lng: -51.57, name: 'Cassilândia' },
    { lat: -20.81, lng: -49.37, name: 'São José do Rio Preto' },
    { lat: -22.90, lng: -47.06, name: 'Campinas' },
    { lat: -23.96, lng: -46.33, name: 'Porto de Santos' }
  ],
  // BR-101 (Litoral Sul - Sudeste - Nordeste)
  [
    { lat: -29.93, lng: -51.71, name: 'Triunfo' },
    { lat: -27.59, lng: -48.54, name: 'Florianópolis' },
    { lat: -26.90, lng: -48.66, name: 'Itajaí' },
    { lat: -26.30, lng: -48.84, name: 'Joinville' },
    { lat: -25.51, lng: -48.50, name: 'Paranaguá' },
    { lat: -23.96, lng: -46.33, name: 'Santos' },
    { lat: -20.31, lng: -40.31, name: 'Vitória' },
    { lat: -12.97, lng: -38.50, name: 'Salvador' }
  ]
];

// Helper: Convert Lat/Lng to Web Mercator tile X, Y and Pixel offsets
function latLngToMercator(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

function mercatorToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (rad * 180) / Math.PI;
  return { lat, lng };
}

export const RealGeoMap: React.FC<RealGeoMapProps> = ({
  initialCenter = [-15.78, -47.93],
  initialZoom = 4,
  minZoom = 3,
  maxZoom = 13,
  height = '480px',
  className = '',
  showLayerToggle = true,
  showControls = true,
  showBorders = true,
  showRoads = true,
  showCityNames = true,
  selectedMarkerId,
  onMapClick,
  children
}) => {
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [tileMode, setTileMode] = useState<MapTileMode>('dark');
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 600, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer to get true pixel dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerSize({
            width: Math.max(300, entry.contentRect.width),
            height: Math.max(200, entry.contentRect.height)
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update center when initialCenter changes externally
  useEffect(() => {
    setCenter(initialCenter);
  }, [initialCenter[0], initialCenter[1]]);

  useEffect(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  // Project geographic coordinates [lat, lng] to container pixel coordinates (x, y)
  const project = useMemo(() => {
    return (lat: number, lng: number) => {
      const centerMercator = latLngToMercator(center[0], center[1], zoom);
      const pointMercator = latLngToMercator(lat, lng, zoom);
      const tileSize = 256;

      const pxX = (pointMercator.x - centerMercator.x) * tileSize + containerSize.width / 2;
      const pxY = (pointMercator.y - centerMercator.y) * tileSize + containerSize.height / 2;

      const inBounds = pxX >= -50 && pxX <= containerSize.width + 50 && pxY >= -50 && pxY <= containerSize.height + 50;

      return {
        x: pxX,
        y: pxY,
        xPercent: (pxX / containerSize.width) * 100,
        yPercent: (pxY / containerSize.height) * 100,
        inBounds
      };
    };
  }, [center, zoom, containerSize]);

  // Calculate visible tiles for grid
  const visibleTiles = useMemo(() => {
    const tileSize = 256;
    const centerMercator = latLngToMercator(center[0], center[1], zoom);
    
    const halfWidthTiles = (containerSize.width / 2) / tileSize;
    const halfHeightTiles = (containerSize.height / 2) / tileSize;

    const minX = Math.floor(centerMercator.x - halfWidthTiles) - 1;
    const maxX = Math.ceil(centerMercator.x + halfWidthTiles) + 1;
    const minY = Math.floor(centerMercator.y - halfHeightTiles) - 1;
    const maxY = Math.ceil(centerMercator.y + halfHeightTiles) + 1;

    const n = Math.pow(2, zoom);
    const tiles = [];

    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        if (ty >= 0 && ty < n) {
          // Normalize X for longitude wrapping
          const normX = ((tx % n) + n) % n;
          const px = (tx - centerMercator.x) * tileSize + containerSize.width / 2;
          const py = (ty - centerMercator.y) * tileSize + containerSize.height / 2;

          let tileUrl = '';
          if (tileMode === 'satellite') {
            // High-resolution satellite tiles (Esri World Imagery, free, no API key)
            tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${normX}`;
          } else {
            // OpenStreetMap Standard Tiles (open-source, 100% free, no API key required)
            const subdomains = ['a', 'b', 'c'];
            const s = subdomains[Math.abs(tx + ty) % subdomains.length];
            tileUrl = `https://${s}.tile.openstreetmap.org/${zoom}/${normX}/${ty}.png`;
          }

          tiles.push({
            key: `${zoom}-${normX}-${ty}-${tileMode}`,
            url: tileUrl,
            left: px,
            top: py,
            width: tileSize,
            height: tileSize
          });
        }
      }
    }
    return tiles;
  }, [center, zoom, containerSize, tileMode]);

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click and when not clicking an interactive button
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      const tileSize = 256;
      const centerMercator = latLngToMercator(center[0], center[1], zoom);
      const newMercX = centerMercator.x - dx / tileSize;
      const newMercY = centerMercator.y - dy / tileSize;

      const newCenter = mercatorToLatLng(newMercX, newMercY, zoom);
      // Bound latitude between -80 and +80
      const boundedLat = Math.max(-75, Math.min(75, newCenter.lat));
      setCenter([boundedLat, newCenter.lng]);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Zoom controls
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(maxZoom, prev + 1));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(minZoom, prev - 1));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCenter(initialCenter);
    setZoom(initialZoom);
  };

  return (
    <div 
      ref={containerRef}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      className={`relative w-full rounded-2xl overflow-hidden select-none bg-[var(--vx-deep)] border border-slate-800 shadow-2xl ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. Base Map Tile Layer Grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {visibleTiles.map(tile => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            loading="lazy"
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: `${tile.width}px`,
              height: `${tile.height}px`,
              transform: 'translate3d(0,0,0)',
              filter: tileMode === 'dark' 
                ? 'invert(92%) hue-rotate(180deg) brightness(85%) contrast(120%) grayscale(15%)' 
                : tileMode === 'satellite'
                ? 'brightness(0.95) contrast(1.05)'
                : 'none'
            }}
            className="transition-opacity duration-300 pointer-events-none"
            onError={(e) => {
              // Graceful fallback for tile errors
              (e.target as HTMLImageElement).style.opacity = '0';
            }}
          />
        ))}
      </div>

      {/* 2. Topographical / Dark Contrast Atmospheric Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--vx-deep)]/40 via-transparent to-[var(--vx-deep)]/50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(7,11,20,0.6)_100%)] pointer-events-none" />

      {/* 3. SVG Geographic Layer (Logistics Highways, Country Contours & City Pins) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="highwayGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Real Logistics Highways Network */}
        {showRoads && BRAZIL_LOGISTICS_HIGHWAYS.map((highway, hIdx) => {
          const points = highway
            .map(pt => {
              const p = project(pt.lat, pt.lng);
              return `${p.x},${p.y}`;
            })
            .join(' ');

          return (
            <g key={`hway-${hIdx}`}>
              {/* Outer Glow */}
              <polyline
                points={points}
                fill="none"
                stroke="#00F2FF"
                strokeWidth={zoom >= 6 ? "3" : "1.5"}
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core Route Line */}
              <polyline
                points={points}
                fill="none"
                stroke={tileMode === 'satellite' ? '#38bdf8' : '#00F2FF'}
                strokeWidth={zoom >= 6 ? "1.8" : "1.0"}
                strokeDasharray={zoom >= 7 ? "6,4" : "none"}
                strokeOpacity="0.65"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Real Major Cities Geo-Labels */}
        {showCityNames && BRAZIL_MAJOR_CITIES.map(city => {
          const p = project(city.lat, city.lng);
          if (!p.inBounds) return null;
          // Only show tier 2 cities if zoomed in enough
          if (city.tier === 2 && zoom < 5) return null;

          return (
            <g key={city.name} className="pointer-events-none transition-all">
              {/* City Dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={city.tier === 1 ? 3 : 2}
                fill="#38bdf8"
                stroke="#070b14"
                strokeWidth="1"
                opacity="0.85"
              />
              {/* City Label */}
              <text
                x={p.x + 5}
                y={p.y + 3}
                fill={tileMode === 'streets' ? '#0f172a' : '#cbd5e1'}
                fontSize={zoom >= 6 ? "10" : "8.5"}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={city.tier === 1 ? "600" : "400"}
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              >
                {city.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 4. Interactive Children Overlays (Custom Tenant Pins, Fleet Vehicles, Geofences) */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {typeof children === 'function' ? children({ project }) : children}
      </div>

      {/* 5. Map Controls Toolbar (Top Right & Bottom Right) */}
      {showControls && (
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 pointer-events-auto">
          
          {/* Layer Selector */}
          {showLayerToggle && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setTileMode('dark'); }}
                title="Visão Cartografia Dark Matter"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  tileMode === 'dark'
                    ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌙 Dark
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setTileMode('satellite'); }}
                title="Visão Satélite de Alta Resolução"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  tileMode === 'satellite'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛰️ Satélite
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setTileMode('streets'); }}
                title="Visão Ruas & Logística"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  tileMode === 'streets'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🗺️ Ruas
              </button>
            </div>
          )}

          {/* Zoom In / Out / Reset */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl flex flex-col items-center self-end gap-1">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= maxZoom}
              title="Aproximar Zoom"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-4 h-[1px] bg-slate-800" />
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= minZoom}
              title="Afastar Zoom"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-4 h-[1px] bg-slate-800" />
            <button
              type="button"
              onClick={handleReset}
              title="Centralizar Brasil"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-[var(--vx-neon)] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* 6. Real Lat/Lng Navigation Badge (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-30 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-[10px] font-mono text-slate-300 shadow-xl pointer-events-none">
        <Navigation className="w-3.5 h-3.5 text-[var(--vx-neon)] animate-pulse" />
        <span>Centro: <strong>{center[0].toFixed(2)}°S, {Math.abs(center[1]).toFixed(2)}°W</strong></span>
        <span className="text-slate-600">|</span>
        <span>Zoom: <strong>{zoom}x</strong></span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          OpenStreetMap Tiles LatAm
        </span>
      </div>

    </div>
  );
};
