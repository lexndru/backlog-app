// Copyright (c) 2019 Alexandru Catrina <alex@codeissues.net>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const { resolve, basename } = require('path')
const { ipcMain } = require('electron')

const { BacklogApp } = require('./app')
const { ResourceLoader } = require('./res')
const { ContextHandler } = require('./ctx')
const { BacklogParser } = require('./parser')

const config = require('../com/config')

/**
 * Main
 */
async function main (argv) {
  const masterLayout = resolve(__dirname, '..', 'res', 'main')

  const loader = new ResourceLoader()
  loader.setTemplate(masterLayout)

  const ready = ContextHandler.create(async (app) => {
    app.webContents.send(config.channel.uiReady, true)
  })

  const close = ContextHandler.create(async (app) => {
    // TODO: what is the best way to save data before application closes?
  })

  const options = {
    title: BacklogApp.constructor.name,
    icon: resolve('res', 'img', 'notes.png'),
    ...BacklogApp.WINDOW_PREFS
  }

  const backlog = BacklogApp.setup(options, loader, { ready, close })

  ipcMain.on(config.channel.save, async (sender, data) => {
    if (data && data.filepath) {
      let { filepath, todoList } = data
      let parser = new BacklogParser()
      let status = await parser.write(filepath, todoList)
      backlog.webContents.send(config.channel.uiStatusBar, status)
    }
  })

  ipcMain.on(config.channel.fileOpenWrite, async (sender, filepath) => {
    if (filepath) {
      ResourceLoader.create(filepath)
      backlog.webContents.send(config.channel.refreshLayout, basename(filepath))
      loader.setFilepath(filepath)
    }
  })

  ipcMain.on(config.channel.fileOpenRead, async (sender, filepath) => {
    if (filepath) {
      let parser = new BacklogParser()
      await parser.read(filepath)
      for (let note of parser.notes) {
        backlog.webContents.send(config.channel.refreshTodoList, note)
      }
      backlog.webContents.send(config.channel.refreshLayout, basename(filepath))
      loader.setFilepath(filepath)
    }
  })

  if (process.env.DEBUG) {
    backlog.webContents.openDevTools()
  }

  backlog.run()
}

module.exports = main
