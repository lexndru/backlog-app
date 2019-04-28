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

const callable = (cb, ch) => async () => cb(ch.context)

/**
 * ContextHandler
 */
class ContextHandler {
  constructor () {
    this._context = null
    this._handler = null
  }

  registerContext (ctx) {
    if (!ctx || ctx === null) {
      throw new Error(`Cannot register null context`)
    }
    this._context = ctx
  }

  registerHandler (cb) {
    if (!(cb && cb.constructor && cb.call && cb.apply)) {
      throw new Error(`Callback must be a function, got ${typeof cb}`)
    }
    this._handler = callable(cb, this)
  }

  get handler () {
    if (this._handler !== null) {
      return this._handler
    }
    throw new Error(`Handler is not set`)
  }

  get context () {
    if (this._context !== null) {
      return this._context
    }
    throw new Error(`Context is not set`)
  }

  static create (cb, ctx) {
    let ch = new ContextHandler()
    if (cb) {
      ch.registerHandler(cb)
    }
    if (ctx) {
      ch.registerContext(ctx)
    }
    return ch
  }
}

module.exports = { ContextHandler }
