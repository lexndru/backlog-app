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
const os = require('os')

const { createInterface } = require('readline')

const Note = require(`../com/class/note`)

/**
 * BacklogParser
 */
class BacklogParser {
  constructor () {
    this._notes = new Set()
    this._reader = null
  }

  async read (fp) {
    if (this._reader != null) {
      throw new Error(`Already initialized reader`)
    } else {
      this._reader = createInterface({
        input: fs.createReadStream(fp),
        console: false
      })
    }
    return new Promise(async (resolve, reject) => {
      this._reader.on(`close`, () => resolve())
      this._reader.on(`error`, (e) => reject(e))
      this._reader.on(`line`, (line) => this._parseStringToNote(line))
    })
  }

  async write (fp, iterable) {
    let lines = []
    for (let item of iterable) {
      let note = Note.Load(item)
      let noteString = this._parseNoteToString(note)
      lines.push(noteString)
    }
    return new Promise(async (resolve, reject) => {
      fs.writeFile(fp, lines.join(os.EOL), err => err ? reject(err) : resolve())
    })
  }

  _parseNoteToString (note) {
    if (note instanceof Note) {
      this._notes.add(note)
      return `[${note.getChecked() ? 'x' : ' '}] ${note.getMessage()}`
    }
    throw new Error(`Unexpected ${typeof note} instead of note`)
  }

  _parseStringToNote (line) {
    if (line && line.length > 0) {
      let check = line.substring(0, 3)
      if (/\[\s|x\]/.test(check)) {
        let note = new Note()
        note.setChecked(check !== `[ ]`)
        note.setMessage(line.substring(3).trim())
        this._notes.add(note)
        return note
      }
    }
    throw new Error(`Cannot use ${typeof line} as "${line}" to create note`)
  }

  * iterate () {
    for (let note of this._notes) {
      yield note
    }
  }

  get notes () {
    return this.iterate()
  }
}

module.exports = { BacklogParser }
