/**
 * Copyright (c) 2019 Alexandru Catrina <alex@codeissues.net>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict'

const { remote, ipcRenderer } = require('electron')

const { UI } = require('./ui')

const Note = require('../../com/class/note')
const config = require('../../com/config')

/**
 * BacklogUI
 */
class BacklogUI extends UI {
  constructor () {
    super()
    this._notes = new Map()
    this._ready = false
    this._filepath = null
    this._autosave = null
    this._saveCallback = null
    this._textLimit = 100
  }

  get ApplicationMenu () {
    return [
      {
        label: 'File',
        submenu: [
          {
            label: 'New backlog',
            accelerator: 'Control+N',
            click: () => this.callCreateBacklog()
          },
          {
            label: 'Open backlog...',
            accelerator: 'Control+O',
            click: () => this.callOpenBacklog()
          },
          {
            type: 'separator'
          },
          {
            label: 'Save',
            accelerator: 'Control+S',
            click: () => this.callSaveBacklog()
          },
          {
            label: 'Save as...',
            click: () => this.callSaveAsBacklog()
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            role: 'quit'
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Cut',
            role: 'cut'
          },
          {
            label: 'Copy',
            role: 'copy'
          },
          {
            label: 'Paste',
            role: 'paste'
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Writer mode',
            type: 'radio',
            id: 'appMenuWriteMode',
            checked: true,
            click: () => console.log(`Clicked on write`)
          },
          {
            label: 'Organize mode',
            type: 'radio',
            id: 'appMenuEditMode',
            click: () => console.log(`Clicked on organize`)
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'View license',
            click: () => remote.shell.openExternal(config.link.license)
          },
          {
            type: 'separator'
          },
          {
            label: 'Documetation',
            click: () => remote.shell.openExternal(config.link.documentation)
          }
        ]
      }
    ]
  }

  setupApplicationMenu () {
    let appMenu = remote.Menu.buildFromTemplate(this.ApplicationMenu)
    remote.Menu.setApplicationMenu(appMenu)
  }

  get ButtonCreateOptions () {
    return {
      title: 'Create project backlog',
      filters: [
        {
          name: 'Notes',
          extensions: ['notes']
        }
      ],
      buttonLabel: 'Create'
    }
  }

  get ButtonSaveOptions () {
    return {
      title: 'Save project backlog',
      filters: [
        {
          name: 'Notes',
          extensions: ['notes']
        }
      ],
      buttonLabel: 'Save'
    }
  }

  get ButtonOpenOptions () {
    return {
      title: 'Open project backlog',
      filters: [
        {
          name: 'Notes',
          extensions: ['notes']
        }
      ],
      properties: ['openFile', 'showHiddenFiles']
    }
  }

  createUserNote () {
    let note = new Note()
    note.setMessage(this.UserInput.value)
    note.setChecked(false)
    this.appendUserNote(note)
    this.resetUserInput()
  }

  appendUserNote (note) {
    let posId = `_${this._notes.size + 1}`
    let { wrapper, item } = this.createListItem(note.getMessage(), note.getChecked(), posId)

    // semantic ui module requires jQuery
    window.jQuery(wrapper).checkbox({
      onChecked: () => {
        item.setAttribute('data-done', 'true')
        note.setChecked(true)
      },
      onUnchecked: () => {
        item.setAttribute('data-done', 'false')
        note.setChecked(false)
      }
    })

    this.appendToList(item)
    this._notes.set(item, note)
  }

  registerSaveCallback (cb) {
    if (!(cb && cb.constructor && cb.call && cb.apply)) {
      throw new Error(`Callback must be a function, got ${typeof cb}`)
    }
    this._saveCallback = cb
  }

  defaultSaving (filepath) {
    let notes = []
    for (let note of this._notes.values()) {
      notes.push(Note.Dump(note))
    }
    ipcRenderer.send(config.channel.save, {
      filepath: filepath || this._filepath,
      todoList: notes
    })
  }

  async callCreateBacklog (_event) {
    remote.dialog.showSaveDialog(this.ButtonCreateOptions, async (filename) => {
      this._filepath = filename
      ipcRenderer.send(config.channel.fileOpenWrite, this._filepath)
    })
  }

  async callOpenBacklog (_event) {
    remote.dialog.showOpenDialog(this.ButtonOpenOptions, async (filePaths) => {
      if (filePaths && filePaths.length > 0) {
        this._filepath = filePaths.shift()
        ipcRenderer.send(config.channel.fileOpenRead, this._filepath)
      }
    })
  }

  async callSaveBacklog (filepath) {
    if (this._saveCallback !== null) {
      await this._saveCallback(filepath)
    } else {
      throw new Error(`Unregistered save callback is not supported`)
    }
  }

  async callSaveAsBacklog () {
    remote.dialog.showSaveDialog(this.ButtonSaveOptions, async (filename) => {
      if (filename) {
        this.callSaveBacklog(filename)
      }
    })
  }

  async autosave (saveInterval) {
    if (this._autosave === null) {
      let interval = 1000 * 60 * 5 // ms * sec * min
      if (saveInterval + 0 === saveInterval && saveInterval > 0) {
        interval = saveInterval
      }
      this._autosave = setInterval(async () => this.callSaveAsBacklog(), interval)
    }
    return this._autosave
  }

  listen () {
    this.ButtonNew.addEventListener('click', this.callCreateBacklog.bind(this))
    this.ButtonOpen.addEventListener('click', this.callOpenBacklog.bind(this))

    this.UserInput.addEventListener('keydown', async (e) => {
      if (e.charCode === UI.ENTER || e.which === UI.ENTER) {
        if (this.UserInput.value.trim().length === 0) {
          return e.preventDefault()
        }
        if (this.UserInput.value.length > this._textLimit) {
          document.body.classList.add('shake')
        } else {
          this.createUserNote()
          setTimeout(this.refreshUserInput.bind(this), 0, this._textLimit)
        }
        return e.preventDefault()
      }
      if (this.UserInput.value.length > this._textLimit) {
        document.body.classList.add('shake')
        setTimeout(() => {
          document.body.classList.remove('shake')
        }, 1000)
      } else {
        document.body.classList.remove('shake')
        setTimeout(this.refreshUserInput.bind(this), 0, this._textLimit)
      }
    })

    ipcRenderer.on(config.channel.uiReady, this.initialize.bind(this))
    ipcRenderer.on(config.channel.refreshLayout, this.refreshLayout.bind(this))
    ipcRenderer.on(config.channel.refreshTodoList, this.refreshList.bind(this))
  }

  refreshList (sender, encodedNote) {
    let note = Note.Load(encodedNote)
    if (note) {
      this.appendUserNote(note)
    }
  }

  refreshLayout (sender, filename) {
    if (!this.Title.parentElement.classList.contains('view-mode')) {
      this.Title.parentElement.classList.add('view-mode')
      setTimeout(async () => {
        this.Title.parentElement.querySelector('h1 + div').remove()
      }, 250)
      this.createUserInput()
      if (filename.endsWith('.notes')) {
        filename = filename.substring(0, filename.length - 6) // 6 chars in ".notes"
      }
      this.Title.textContent = filename
    }
  }

  initialize (sender, signal) {
    if (!signal) {
      throw new Error(`Unexpected signal received upon initalization`)
    }
    if (this._ready) {
      throw new Error(`UI already initailized`)
    }
    this.Loader.remove()
    this.createLayout()
    this._ready = true
  }

  static run () {
    let ui = new BacklogUI()
    ui.setupApplicationMenu()
    ui.listen()
    ui.registerSaveCallback(ui.defaultSaving.bind(ui))
    ui.autosave()
    return ui
  }
}

module.exports = { BacklogUI }
