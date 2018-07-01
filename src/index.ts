import path from 'path'
import Module from 'module'
import getCallerFile from 'get-caller-file'

type Mocks = {
  [key: string]: any
}
type Meta = {
  filename: string,
  parent: Meta | null, // eslint-disable-line no-use-before-define
  [key: string]: any
}

const _Module: any = Module
const originalLoad = _Module._load
const mocked = new Map<string, Mocks>()

const getMocks = (meta: Meta) => {
  if (mocked.has(meta.filename)) {
    return mocked.get(meta.filename)
  }

  if (meta.parent !== null) {
    return getMocks(meta.parent)
  }

  return null
}

const isCacheRelated = (target: string, meta: Meta) => {
  if (target === meta.filename) {
    return true
  }

  if (meta.parent !== null) {
    return isCacheRelated(target, meta.parent)
  }

  return false
}

const deleteFromCache = (fullPath: string) => {
  Object.keys(_Module._cache).forEach((key) => {
    const meta: Meta = _Module._cache[key]

    if (isCacheRelated(fullPath, meta)) {
      Reflect.deleteProperty(_Module._cache, key)
    }
  })
}

export const mock = (file: string, mocks: Mocks) => {
  const callerDir = path.dirname(getCallerFile())
  const targetFile = path.resolve(callerDir, file)
  const fullPath: string = _Module._resolveFilename(targetFile)

  deleteFromCache(fullPath)
  mocked.set(fullPath, mocks)

  if (mocked.size === 1) {
    _Module._load = (request: string, meta: Meta, ...rest) => {
      const mocks = getMocks(meta)

      if (mocks !== null && Reflect.has(mocks, request)) {
        const mock = mocks[request]

        Reflect.defineProperty(mock, '__esModule', {
          value: true
        })

        return mock
      }

      return originalLoad(request, meta, ...rest)
    }
  }
}

export const unmock = (file: string) => {
  const callerDir = path.dirname(getCallerFile())
  const targetFile = path.resolve(callerDir, file)
  const fullPath: string = _Module._resolveFilename(targetFile)

  deleteFromCache(fullPath)
  mocked.delete(fullPath)

  if (mocked.size === 0) {
    _Module._load = originalLoad
  }
}
