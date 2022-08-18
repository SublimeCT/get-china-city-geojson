const { writeFileSync } = require('fs')
const axios = require('axios')
const path = require('path')

const PATH_CHINA = path.join(__dirname, './$adcode_full.json')
const PATH_PROVINCE_DIR = path.join(__dirname, './provinces')
const DOWNLOAD_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/$adcode_full.json'
const PATH_CITY_FILE = PATH_PROVINCE_DIR + '/$adcode_full.json'
const PATH_CITY_INDEX_FILE = PATH_PROVINCE_DIR + '/index.js'

const downloadGeojson = async adcode => {
  const url = DOWNLOAD_URL.replace('$adcode', adcode)
  const res = await axios({ url, method: 'GET' })
  return res.data
}

const writeFile = ( filePath, geojson ) => {
  writeFileSync(filePath, typeof geojson === 'string' ? geojson : JSON.stringify(geojson))
}

const download = async (adcode, filePath) => {
  const geojson = await downloadGeojson(adcode)
  const _filePath = filePath.replace('$adcode', adcode)
  writeFile(_filePath, geojson)
  console.log('[download success]: ', _filePath)
  return geojson
}

const generateProvinceIndexJs = async properties => {
  let content = properties.map(property => `import ${property.name} from './${property.adcode}_full.json'`).join('\n')
  content += '\n\nexport {\n'
  content += properties.map(property => `  ${property.name},`).join('\n')
  content += '\n}\n'
  await writeFile(PATH_CITY_INDEX_FILE, content)
  console.log('[generage success]: ', PATH_CITY_INDEX_FILE)
}

/**
 * 下载省份和省份包含的所有城市的 geojson 数据
 * @param {string} adcode 省份 / 城市 编码
 */
const main = async adcode => {
  // 1. 下载省份数据
  const geojson = await download(adcode, PATH_CHINA)
  // 2. 遍历省份 geojson 数据下载城市数据
  const loadedFeatures = []
  const cityDownloadProcess = geojson.features.map(feature => {
    return download(feature.properties.adcode, PATH_CITY_FILE)
      .then(() => loadedFeatures.push(feature))
      .catch(err => console.log(err.message, feature.properties.adcode))
  })
  await Promise.all(cityDownloadProcess)
  // 3. 生成 province/index.js
  await generateProvinceIndexJs(loadedFeatures.map(feature => feature.properties))
}

main('100000')
