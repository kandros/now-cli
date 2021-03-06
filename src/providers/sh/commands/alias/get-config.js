// @flow
import path from 'path'
import { Output } from '../../util/types'
import humanizePath from '../../../../util/humanize-path'
import type { Config } from '../../util/types'

// Local modules
import { CantParseJSONFile, CantFindConfig } from '../../util/errors'
import readJSONFile from './read-json-file'
import readPackage from './read-package'

let config: Config | void

async function getConfig(output: Output, configFile?: string) {
  const localPath = process.cwd()

  // If config was already read, just return it
  if (config) {
    return config
  }

  // First try with the config supplied by the user via --local-config
  if (configFile) {
    const localFilePath = path.resolve(localPath, configFile)
    output.debug(`Found config in provided --local-config path ${localFilePath}`)
    const localConfig = await readJSONFile(localFilePath)
    if (localConfig instanceof CantParseJSONFile) {
      return localConfig
    } else if (localConfig !== null) {
      const castedConfig: Config = localConfig
      config = castedConfig
      return config
    }
  }

  // Then try with now.json in the same directory
  const nowFilePath = path.resolve(localPath, 'now.json')
  const mainConfig = await readJSONFile(nowFilePath);
  if (mainConfig instanceof CantParseJSONFile) {
    return mainConfig
  } else if (mainConfig !== null) {
    output.debug(`Found config in file ${nowFilePath}`)
    const castedConfig: Config = mainConfig
    config = castedConfig
    return config
  }

  // Finally try with the package
  const pkgFilePath = path.resolve(localPath, 'package.json')
  const pkgConfig = await readConfigFromPackage(pkgFilePath);
  if (pkgConfig instanceof CantParseJSONFile) {
    return pkgConfig
  } else if (pkgConfig) {
    output.debug(`Found config in package ${nowFilePath}`)
    const castedConfig: Config = pkgConfig
    config = castedConfig
    return config
  }

  // If we couldn't find the config anywhere return error
  return new CantFindConfig([nowFilePath, pkgFilePath].map(humanizePath))
}

async function readConfigFromPackage(file: string) {
  const result = await readPackage(file)
  if (result instanceof CantParseJSONFile) {
    return result
  }

  return result !== null
    ? result.now
    : null
}

export default getConfig
