import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { WELLS_GEOJSON, KARAZHANBAS_BOUNDS } from '../data/wells';
import { Search, X, MapPin, Navigation, Pin } from 'lucide-react';

interface WellMapProps {
  onSelectWell?: (wellNo: string | null, coords?: { lat: number; lon: number }) => void;
  selectedWell?: string;
  readOnly?: boolean;
  pinnedCoords?: { lat: number; lon: number } | null;
}

interface WellFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    id: number;
    well_no: string | null;
    layer: string | null;
    label_dist: number | null;
    needs_review: boolean;
  };
}

const COLOR_OK = '#39d98a';
const COLOR_REVIEW = '#f0a63a';
const COLOR_NONE = '#5b6472';
const COLOR_SELECTED = '#3b82f6';

const PIN_HTML = `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.268 0 0 5.82 0 13c0 9.75 14 23 14 23s14-13.25 14-23C28 5.82 21.732 0 14 0z" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
  <circle cx="14" cy="12" r="5" fill="white"/>
</svg>`;

export const WellMap: React.FC<WellMapProps> = ({ onSelectWell, selectedWell, readOnly = false, pinnedCoords }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const customMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pinModeRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WellFeature[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [coords, setCoords] = useState({ lat: 0, lon: 0, zoom: 0 });
  const [pinMode, setPinMode] = useState(false);
  const [customPin, setCustomPin] = useState<{ lat: number; lon: number } | null>(null);

  const features = WELLS_GEOJSON.features as WellFeature[];

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const upper = q.trim().toUpperCase();
    const matches = features
      .filter(f => f.properties.well_no && f.properties.well_no.toUpperCase().includes(upper))
      .slice(0, 8);
    setSearchResults(matches);
    setShowResults(matches.length > 0);
  }, [features]);

  const selectWell = useCallback((feature: WellFeature) => {
    const [lon, lat] = feature.geometry.coordinates;
    onSelectWell?.(feature.properties.well_no, { lat, lon });
    setSearchQuery(feature.properties.well_no || '');
    setShowResults(false);
    setCustomPin(null);

    mapRef.current?.flyTo({
      center: [lon, lat],
      zoom: 14,
      duration: 500,
    });
  }, [onSelectWell]);

  const placeCustomPin = useCallback((lat: number, lon: number) => {
    setCustomPin({ lat, lon });
    const label = `СКВ: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    onSelectWell?.(label, { lat, lon });
    setSearchQuery('');
    setShowResults(false);
  }, [onSelectWell]);

  const clearSelection = useCallback(() => {
    onSelectWell?.(null);
    setSearchQuery('');
    setCustomPin(null);
    setPinMode(false);
    pinModeRef.current = false;
  }, [onSelectWell]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const bounds = KARAZHANBAS_BOUNDS;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#f1f5f9' } },
        ],
      },
      center: [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2],
      zoom: 11,
      maxBounds: [
        [bounds.minLon - 0.03, bounds.minLat - 0.03],
        [bounds.maxLon + 0.03, bounds.maxLat + 0.03],
      ] as [[number, number], [number, number]],
      minZoom: 10,
      maxZoom: 17,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({
      compact: true,
      customAttribution: 'OSM · DWG-схема Каражамбас',
    }));

    map.on('mousemove', e => {
      setCoords({ lat: e.lngLat.lat, lon: e.lngLat.lng, zoom: map.getZoom() });
    });

    map.on('load', () => {
      map.addSource('osm', {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      });
      map.addLayer({ id: 'osm', type: 'raster', source: 'osm' });

      map.addSource('wells', {
        type: 'geojson',
        data: WELLS_GEOJSON,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40,
        promoteId: 'id',
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'wells',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#94a3b8', 10, '#d9a441', 50, '#e8873a'],
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.7)',
        },
      });

      map.addLayer({
        id: 'wells-unclustered',
        type: 'circle',
        source: 'wells',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 12, 5, 15, 8],
          'circle-color': [
            'case',
            ['==', ['get', 'well_no'], null], COLOR_NONE,
            ['get', 'needs_review'], COLOR_REVIEW,
            COLOR_OK,
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'wells-labels',
        type: 'symbol',
        source: 'wells',
        filter: ['!', ['has', 'point_count']],
        minzoom: 13,
        layout: {
          'text-field': ['get', 'well_no'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 9,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      // Fit map to well data extent
      map.fitBounds(
        [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
        { padding: 30, duration: 0 }
      );

      map.on('click', 'clusters', async e => {
        const f = e.features?.[0];
        if (!f) return;
        const clusterId = f.properties.cluster_id;
        const src = map.getSource('wells') as maplibregl.GeoJSONSource;
        try {
          const zoom = await src.getClusterExpansionZoom(clusterId);
          map.easeTo({ center: f.geometry.coordinates as [number, number], zoom });
        } catch {}
      });

      map.on('click', 'wells-unclustered', e => {
        if (readOnly) return;
        const f = e.features?.[0];
        if (!f) return;
        selectWell(f as unknown as WellFeature);
      });

      // Click on empty area — place pin if pin mode is active
      map.on('click', e => {
        if (readOnly || !pinModeRef.current) return;
        const pointFeatures = map.queryRenderedFeatures(e.point, { layers: ['wells-unclustered', 'clusters'] });
        if (pointFeatures.length > 0) return; // clicked on a well/cluster, let other handlers deal with it

        const { lat, lng } = e.lngLat;
        placeCustomPin(lat, lng);
        setPinMode(false);
        pinModeRef.current = false;
      });

      map.on('mouseenter', 'wells-unclustered', () => {
        if (!readOnly && !pinModeRef.current) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'wells-unclustered', () => {
        map.getCanvas().style.cursor = (pinModeRef.current && !readOnly) ? 'crosshair' : '';
      });

      map.on('mouseenter', 'clusters', () => {
        if (!readOnly && !pinModeRef.current) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = (pinModeRef.current && !readOnly) ? 'crosshair' : '';
      });

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update custom marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (customMarkerRef.current) {
      customMarkerRef.current.remove();
      customMarkerRef.current = null;
    }

    if (customPin) {
      const el = document.createElement('div');
      el.innerHTML = PIN_HTML;
      el.style.cursor = 'pointer';
      el.title = 'Место работ (пользовательская метка)';
      customMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([customPin.lon, customPin.lat])
        .addTo(map);
    }
  }, [customPin, mapLoaded]);

  // Set initial pin when readOnly + pinnedCoords provided
  useEffect(() => {
    if (readOnly && pinnedCoords) {
      setCustomPin(pinnedCoords);
    }
  }, [readOnly, pinnedCoords]);

  // Toggle pin mode cursor
  useEffect(() => {
    pinModeRef.current = pinMode;
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = pinMode ? 'crosshair' : '';
    }
  }, [pinMode]);

  // Highlight selected well
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    try {
      map.setPaintProperty('wells-unclustered', 'circle-color', [
        'case',
        ['==', ['get', 'well_no'], null], COLOR_NONE,
        ['==', ['get', 'well_no'], selectedWell || null], COLOR_SELECTED,
        ['get', 'needs_review'], COLOR_REVIEW,
        COLOR_OK,
      ]);
      map.setPaintProperty('wells-unclustered', 'circle-radius', [
        'case',
        ['==', ['get', 'well_no'], selectedWell || null],
        ['interpolate', ['linear'], ['zoom'], 10, 5, 12, 8, 15, 14],
        ['interpolate', ['linear'], ['zoom'], 10, 2.5, 12, 5, 15, 8],
      ]);
    } catch {}
  }, [selectedWell, mapLoaded]);

  return (
    <div className="w-full">
      {/* Search + Pin button (hidden in readOnly mode) */}
      {!readOnly && (
        <div className="relative mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск скважины, например T112..."
              className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={clearSelection}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setPinMode(!pinMode)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              pinMode
                ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Pin size={15} className={pinMode ? 'text-red-500' : ''} />
            {pinMode ? 'Укажите точку на карте' : 'Поставить метку'}
          </button>
        </div>
      )}

      {/* Map container */}
      <div className="relative">
        <div
          ref={mapContainer}
          className={`w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden ${readOnly ? 'h-[280px]' : 'h-[400px]'}`}
        />

        {/* Coordinates display */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-mono text-gray-500 border border-gray-200 shadow-sm pointer-events-none">
          {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
        </div>

        {/* Pin mode indicator */}
        {pinMode && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md flex items-center gap-2 animate-pulse">
            <Pin size={14} />
            Кликните по карте, чтобы поставить метку
          </div>
        )}

        {/* Custom pin label */}
        {customPin && !pinMode && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md flex items-center gap-2">
            <MapPin size={14} />
            <span className="font-mono text-xs">
              {customPin.lat.toFixed(5)}, {customPin.lon.toFixed(5)}
            </span>
            {!readOnly && (
              <button onClick={clearSelection} className="text-red-200 hover:text-white ml-1">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Selected well tag */}
        {selectedWell && !customPin && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md flex items-center gap-2">
            <MapPin size={14} />
            <span className="font-mono">{selectedWell}</span>
            <button onClick={clearSelection} className="text-blue-200 hover:text-white ml-1">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Help text */}
      {!readOnly && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Navigation size={11} /> Клик по скважине — выбор. Кнопка «Поставить метку» — произвольная точка
        </p>
      )}
    </div>
  );
};
