import maplibregl from "maplibre-gl";

export const style: maplibregl.Style = {
  version: 8,
  center: [138.2, 39.48],
  zoom: 4.5,
  sources: {
    gsiraster: {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '<a href="http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html" target="_blank">地理院タイル</a> を使って <a href="https://github.com/kamataryo/25000">@kamataryo</a> が作成',
    },
  },
  glyphs: 'https://glyphs.geolonia.com/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'gsiraster',
      type: 'raster',
      source: 'gsiraster',
      minzoom: 0,
      maxzoom: 18,
    },
  ],
}