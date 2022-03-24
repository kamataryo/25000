import maplibregl from 'maplibre-gl';
import { useRef, useEffect } from 'react'
import {style} from './style'
import './map.css'

export default function Map() {
  const mapContainer = useRef<HTMLElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; 
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style,
      hash: true,
      maxZoom: 9.99,
      minZoom: 4,
      localIdeographFontFamily: 'sans-serif',
    })

    map.current
      .once('load', (e) => {
        e.target
          .addSource('map-rects', {
            type: 'vector',
            tiles: [new URL('/tiles', window.location.href).href + '/{z}/{x}/{y}.pbf'],
          })
          .addLayer({
            id: 'map-rects',
            type: 'fill',
            source: 'map-rects',
            "source-layer": 'maps',
            filter: [
              'all',
              ['==', '$type', 'Polygon'],
              ['==', 'scale', 25000],
            ],
            paint: {
              'fill-color': 'rgba(200, 100, 240, 0.1)',
              'fill-outline-color': 'rgba(200, 100, 240, 1)'
            },
          })
          .addLayer({
            id: 'map-labels',
            type: 'symbol',
            source: 'map-rects',
            "source-layer": 'maps',
            filter: [
              'all',
              ['==', '$type', 'Point'],
              ['==', 'scale', 25000],
            ],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 14,
            }
          })
          .on('click', (e) => {
            const features = e.target.queryRenderedFeatures(e.point).filter(feature => feature.geometry.type === 'Polygon');
            const {properties: { name }, source} = features[0]
            if(source === 'map-rects') {
              serialize(name);
              toggleMapOwnership(name, e.target);
            }
          })

          for (const name of deserialize()) {
            toggleMapOwnership(name, e.target)
          }

      })
  });
    

  return (
      <div ref={ref => mapContainer.current = ref} id="map" />
  );
}

function serialize(name: string) {
  const currentOwnerShip = deserialize();
  if (currentOwnerShip.indexOf(name) === -1) {
    currentOwnerShip.push(name);
  } else {
    currentOwnerShip.splice(currentOwnerShip.indexOf(name), 1);
  }
  localStorage.setItem('map-ownership', JSON.stringify(currentOwnerShip));
}

function deserialize() {
  let currentOwnerShip: string[] = [];
  try {
    currentOwnerShip = JSON.parse(localStorage.getItem('map-ownership') || '[]');
    if (!Array.isArray(currentOwnerShip) || !currentOwnerShip.some(ownership => typeof ownership !== 'string')) {
      throw new Error('invalid data');
    }
  } catch {
  }
  return currentOwnerShip;
}

function toggleMapOwnership(name: string, map: maplibregl.Map) {
  const lineKey = `${name}-line`;
  const fillKey = `${name}-fill`;
  if (map.getLayer(lineKey)) {
    map.removeLayer(lineKey);
  } else {
    map.addLayer({
      id: lineKey,
      type: 'line',
      source: 'map-rects',
      "source-layer": 'maps',
      filter: [
        'all',
        ['==', '$type', 'Polygon'],
        ['==', 'name', name],
      ],
      paint: {
        'line-color': 'red',
        'line-width': 3
      },
    });
  }
  if (map.getLayer(fillKey)) {
    map.removeLayer(fillKey);
  } else {
    map.addLayer({
      id: fillKey,
      type: 'fill',
      source: 'map-rects',
      "source-layer": 'maps',
      filter: [
        'all',
        ['==', '$type', 'Polygon'],
        ['==', 'name', name],
      ],
      paint: {
        'fill-color': 'red',
        "fill-opacity": .4,
      },
    });
  }
}