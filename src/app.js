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

const { BrowserWindow } = require('electron')

const { ContextHandler } = require('./ctx')
const { ResourceLoader } = require('./res')

/**
 * BacklogApp
 */
class BacklogApp extends BrowserWindow {
  constructor (appPreferences) {
    super(appPreferences || BacklogApp.WINDOW_PREFS)
    this._res = null
    this._onCloseCb = null
    this._onReadyCb = null
  }

  run () {
    if (this._res != null) {
      this.loadFile(this._res.getTemplate())
    } else {
      throw new Error(`Cannot launch BacklogApp because resource loader is not set`)
    }
  }

  initialize () {
    this.once('ready-to-show', () => this.show())
    if (this._onCloseCb !== null) {
      this.on('close', this._onCloseCb.handler)
    }
    if (this._onReadyCb !== null) {
      this.webContents.on('did-finish-load', this._onReadyCb.handler)
    }
    this.setMinimumSize(BacklogApp.MIN_WIDTH, BacklogApp.MIN_HEIGHT)
    return this
  }

  registerResourceLoader (res) {
    if (res instanceof ResourceLoader) {
      this._res = res
    } else {
      throw new Error(`Unexpected ${typeof res} argument, must be ResourceLoader`)
    }
  }

  registerOnCloseHandler (cb) {
    if (cb instanceof ContextHandler) {
      this._onCloseCb = cb
      this._onCloseCb.registerContext(this)
    } else {
      throw new Error(`Callback must be instance of StateHandler`)
    }
  }

  registerOnReadyHandler (cb) {
    if (cb instanceof ContextHandler) {
      this._onReadyCb = cb
      this._onReadyCb.registerContext(this)
    } else {
      throw new Error(`Callback must be instance of StateHandler`)
    }
  }

  static get MIN_WIDTH () {
    return 500
  }

  static get MIN_HEIGHT () {
    return 500
  }

  static get WINDOW_PREFS () {
    return {
      width: BacklogApp.MIN_WIDTH,
      height: BacklogApp.MIN_HEIGHT,
      resizable: false,
      show: false
    }
  }

  static setup (prefs, res, { ready, close }) {
    let app = new BacklogApp(prefs)
    app.registerResourceLoader(res)
    app.registerOnReadyHandler(ready)
    app.registerOnCloseHandler(close)
    app.initialize()
    return app
  }
}

module.exports = { BacklogApp }
