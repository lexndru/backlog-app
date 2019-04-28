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

const fs = require('fs')

/**
 * ResourceLoader
 */
class ResourceLoader {
  constructor () {
    this._template = null
    this._filepath = null
  }

  setFilepath (fp) {
    if (fp && fp.toString() === fp) {
      if (!fp.endsWith(ResourceLoader.NOTES)) {
        fp += ResourceLoader.NOTES
      }
      this._filepath = fp
    } else {
      throw new Error(`Notes filepath must be string, got ${typeof fp}`)
    }
  }

  getFilepath () {
    if (this._filepath != null) {
      return this._filepath
    }
    throw new Error(`Filepath not set`)
  }

  setTemplate (fp) {
    if (fp && fp.toString() === fp) {
      if (!fp.endsWith(ResourceLoader.HTML)) {
        fp += ResourceLoader.HTML
      }
      this._template = fp
    } else {
      throw new Error(`Template filepath must be string, got ${typeof fp}`)
    }
  }

  getTemplate () {
    if (this._template != null) {
      return this._template
    }
    throw new Error(`Template not set`)
  }

  static exists (fp) {
    return new Promise(async (resolve, reject) => {
      fs.access(fp, fs.F_OK, err => err ? reject(err) : resolve())
    })
  }

  static create (fp) {
    return new Promise(async (resolve, reject) => {
      fs.open(fp, 'wx', (err, fd) => {
        err ? reject(err) : fs.close(fd, err => err ? reject(err) : resolve())
      })
    })
  }

  static get HTML () {
    return `.html`
  }

  static get NOTES () {
    return `.notes`
  }
}

module.exports = { ResourceLoader }
