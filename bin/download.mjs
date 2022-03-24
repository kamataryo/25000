import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

const deg2decimal = (deg) => {
	const [degree, minute, second] = deg.split(' ').map(val => parseFloat(val || 0))
	return degree + minute / 60 + second / 3600
}

const scrapeAreaElements = async (url) => {
	const resp = await fetch(url)
	const html = await resp.text()
	const $ = await cheerio.load(html)
	return $('area')
}

const scrapeTable = async (url) => {
	const resp = await fetch(url)
	const html = await resp.text()
	const $ = await cheerio.load(html)
	const polygons = []
	const labels = []
	for (const tbody of $('table tbody')) {

		const tr1 = $(tbody).find('tr:nth-child(1)')
		const tr2 = $(tbody).find('tr:nth-child(2)')
		const tr3 = $(tbody).find('tr:nth-child(3)')
		const tr4 = $(tbody).find('tr:nth-child(4)')

		const map_number = $(tr1).find('td:nth-child(1)').text()
		const name = $(tr1).find('td:nth-child(2)').text()
		const leftTop = [
			$(tr2).find('td:nth-child(2)').text(),
			$(tr1).find('td:nth-child(4)').text(),
		].map(deg2decimal)
		const rightTop = [
			$(tr2).find('td:nth-child(4)').text(),
			$(tr1).find('td:nth-child(4)').text(),
		].map(deg2decimal)
		const rightBottom = [
			$(tr4).find('td:nth-child(4)').text(),
			$(tr3).find('td:nth-child(4)').text(),
		].map(deg2decimal)
		const leftBottom = [
			$(tr4).find('td:nth-child(2)').text(),
			$(tr3).find('td:nth-child(2)').text(),
		].map(deg2decimal)

		const scale = url.match(/\/50000\//) ? 50000 : 25000
		const coordinates = [leftTop, rightTop, rightBottom, leftBottom, leftTop]
		const center = [
			(leftTop[0] + rightTop[0] + rightBottom[0] + leftBottom[0]) / 4,
			(leftTop[1] + rightTop[1] + rightBottom[1] + leftBottom[1]) / 4,
		]

		if(coordinates.flatMap(val => val).some(val => val === null)) {
			console.warn('Invalid table format:', url)
			continue
		}

		polygons.push({
			type: 'Feature',
			properties: { map_number, name, scale, src: url },
			geometry: {
				type: 'Polygon',
				coordinates: [coordinates]
			}
		})
		labels.push({
			type: 'Feature',
			properties: { map_number, name, scale, src: url },
			geometry: {
				type: 'Point',
				coordinates: center
			}
		})
	}
	return { polygons, labels }
}

const main = async () => {

	const allPolygons = {
		type: 'FeatureCollection',
		features: [],
	}
	const allLabels = {
		type: 'FeatureCollection',
		features: []
	}

	const frontPageURL = 'https://www.gsi.go.jp/MAP/NEWOLDBL/25000-50000/index25000-50000.html'
	const indexAreaElements = await scrapeAreaElements(frontPageURL)
	let count1 = 0
	let count2 = 0
	for (const areaElement of indexAreaElements) {
		count1++
		const subPageURL = new URL(areaElement.attribs.href, frontPageURL).href
		const subAreaElements = await scrapeAreaElements(subPageURL)
		for (const areaElement of subAreaElements) {
			count2++
			const eachPageURL = new URL(areaElement.attribs.href, frontPageURL).href
			const { polygons, labels } = await scrapeTable(eachPageURL)
			allPolygons.features.push(...polygons)
			allLabels.features.push(...labels)
			console.error(`finished: ${count1}/${indexAreaElements.length}, ${count2}/${subAreaElements.length}`)
		}
		count2 = 0
	}

	const polygonMap = new Map()
	const labelMap = new Map()
	for (const feature of allPolygons.features) {
		const { properties: { name } } = feature
		polygonMap.set(name, feature)
	}
	for (const feature of allLabels.features) {
		const { properties: { name } } = feature
		labelMap.set(name, feature)
	}

	const finalPolygons = {
		...allPolygons,
		features: []
	}
	const finalLabels = {
		...allLabels,
		features: []
	}
	for (const entry of polygonMap.entries()) {
		finalPolygons.features.push(entry[1])
		process.stdout.write(JSON.stringify(entry[1]) + '\n')
	}
	for (const entry of labelMap.entries()) {
		finalLabels.features.push(entry[1])
		process.stdout.write(JSON.stringify(entry[1]) + '\n')
	}
}

main()
