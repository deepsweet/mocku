import test from 'tape-promise/tape'
import Module from 'module'

import { mock, unmock } from '../src/'

const _Module: any = Module

test('Module: hook', (t) => {
  t.notOk(
    _Module._load.toString().includes('getMocks'),
    'Module._load should be unhooked if nothing has been mocked'
  )

  mock('./fixtures/scoped/file', {
    './file2': {
      default: 'mock1'
    }
  })

  t.ok(
    _Module._load.toString().includes('getMocks'),
    'Module._load should be hooked'
  )

  const ModuleLoadFirst = _Module._load

  mock('./fixtures/scoped/file3', {
    './file2': {
      default: 'mock2'
    }
  })

  const ModuleLoadSecond = _Module._load

  t.equal(
    ModuleLoadFirst,
    ModuleLoadSecond,
    'Module._load should be hooked only once'
  )

  t.end()
})

test('Module: unhook', (t) => {
  unmock('./fixtures/scoped/file')

  t.ok(
    _Module._load.toString().includes('getMocks'),
    'Module._load should be still hooked after first unmock'
  )

  unmock('./fixtures/scoped/file3')

  t.notOk(
    _Module._load.toString().includes('getMocks'),
    'Module._load should be unhooked if there are no mocks'
  )

  t.end()
})

test('scoped file: mock', async (t) => {
  mock('./fixtures/scoped/file', {
    './file2': {
      default: 'mock'
    }
  })

  const { default: result } = await import('./fixtures/scoped/file')

  t.deepEqual(
    result,
    { default: 'mock' },
    'should mock'
  )
})

test('scoped file: unmock', async (t) => {
  unmock('./fixtures/scoped/file')

  const { default: result } = await import('./fixtures/scoped/file')

  t.deepEqual(
    result,
    { default: 'file2' },
    'should unmock'
  )
})

test('not scoped file: mock', async (t) => {
  mock('./fixtures/scoped/file', {
    './file2': {
      default: 'mock'
    }
  })

  const { default: result } = await import('./fixtures/scoped/file3')

  t.deepEqual(
    result,
    { default: 'file2' },
    'should not mock'
  )

  unmock('./fixtures/scoped/file')
})

test('modules: mock', async (t) => {
  mock('./fixtures/modules/file', {
    fs: {
      readFile: 'readFile'
    },
    '@babel/core': {
      transform: 'babel'
    }
  })

  const { readFile, transform } = await import('./fixtures/modules/file')

  t.equal(
    readFile,
    'readFile',
    'should mock builtin module'
  )

  t.equal(
    transform,
    'babel',
    'should mock external module'
  )
})

test('modules: unmock', async (t) => {
  unmock('./fixtures/modules/file')

  const { readFile, transform } = await import('./fixtures/modules/file')

  t.equal(
    typeof readFile,
    'function',
    'should unmock builtin module'
  )

  t.equal(
    typeof transform,
    'function',
    'should unmock external module'
  )
})
