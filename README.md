# 25000

あなたの持っている 1/25000 地形図を整理するブラウザアプリ。

![](./screenshot.png)

## tiles

```shell
$ mkdir -p tmp
$ node bin/download.mjs > tmp/maps.ndgeojsons
$ mkdir -p public/tiles
$ cat tmp/maps.ndgeojsons | tippecanoe -zg -l maps --drop-densest-as-needed --no-tile-compression --output-to-directory ./public/tiles
```