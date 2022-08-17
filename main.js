const { writeFileSync } = require('fs')
const axios = require('axios')
const path = require('path')

const PATH_CHINA = path.join(__dirname, './$adcode_full.json')
const PATH_PROVINCE_DIR = path.join(__dirname, './provinces')
const DOWNLOAD_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/$adcode_full.json'
const PATH_CITY_FILE = PATH_PROVINCE_DIR + '/$adcode_full.json'

const downloadGeojson = async adcode => {
  const url = DOWNLOAD_URL.replace('$adcode', adcode)
  const res = await axios({ url, method: 'GET' })
  return res.data
}

const writeFile = ( filePath, geojson ) => {
  writeFileSync(filePath, JSON.stringify(geojson))
}

const download = async (adcode, filePath) => {
  const geojson = await downloadGeojson(adcode)
  const _filePath = filePath.replace('$adcode', adcode)
  writeFile(_filePath, geojson)
  console.log('[download success]: ', _filePath)
  return geojson
}

/**
 * 下载省份和省份包含的所有城市的 geojson 数据
 * @param {string} adcode 省份 / 城市 编码
 */
const main = async adcode => {
  // 1. 下载省份数据
  const geojson = await download(adcode, PATH_CHINA)
  // 2. 遍历省份 geojson 数据下载城市数据
  const cityDownloadProcess = geojson.features.map(feature => download(feature.properties.adcode, PATH_CITY_FILE))
  await Promise.all(cityDownloadProcess)
}

main('100000')
