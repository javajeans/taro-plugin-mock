import * as path from 'path'
import * as glob from 'glob'
import { pathToRegexp } from 'path-to-regexp'

export const MOCK_DIR = 'mock'
export const HTTP_METHODS = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']

export function getMockConfigs({
  appPath,
  mocks,
  helper
}: {
  appPath: string,
  mocks?: {
    [key: string]: any
  },
  helper: any
}) {
  const mockDir = path.join(appPath, MOCK_DIR)
  let mockConfigs = {}

  if (helper.fs.existsSync(mockDir)) {
    const mockFiles = glob.sync('**/*.[tj]s', { cwd: mockDir })

    if (mockFiles.length) {
      const absMockFiles = mockFiles.map(file => path.join(mockDir, file))

      //  检查是否存在兼容的方法
      let createRegister
      if (typeof helper.createSwcRegister === 'function') {
        createRegister = helper.createSwcRegister
      } else if (typeof helper.createBabelRegister === 'function') {
        createRegister = helper.createBabelRegister
      } else {
        throw new Error('No valid createRegister function found in helper.')
      }

      //  注册文件
      createRegister({
        only: absMockFiles
      })

      absMockFiles.forEach(absFile => {
        let mockConfig = {}
        try {
          delete require.cache[absFile]
          mockConfig = helper.getModuleDefaultExport(require(absFile))
        } catch (err) {
          throw err
        }
        mockConfigs = Object.assign({}, mockConfigs, mockConfig)
      })
    }
  }

  if (mocks && !helper.isEmptyObject(mocks)) {
    mockConfigs = Object.assign({}, mockConfigs, mocks)
  }

  return mockConfigs
}
