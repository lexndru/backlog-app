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
const { dialog, shell, Menu } = remote

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
    this._lastSave = null
    this._saveCallback = null
    this._textLimit = 100
    this._dirtyState = false
    this._uiMenu = null
    this._uiDefaultMode = true
  }

  get ApplicationMenu () {
    return [
      {
        label: 'File',
        submenu: [
          {
            label: 'New backlog',
            accelerator: 'CommandOrControl+N',
            click: () => this.callCreateBacklog()
          },
          {
            label: 'Open backlog...',
            accelerator: 'CommandOrControl+O',
            click: () => this.callOpenBacklog()
          },
          {
            type: 'separator'
          },
          {
            label: 'Save',
            accelerator: 'CommandOrControl+S',
            click: () => this.callSaveBacklog(),
            enabled: !!this._filepath
          },
          {
            label: 'Save as...',
            click: () => this.callSaveAsBacklog(),
            enabled: !!this._filepath
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
            label: 'Undo',
            role: 'undo',
            accelerator: 'CommandOrControl+Z'
          },
          {
            label: 'Redo',
            role: 'redo',
            accelerator: 'CommandOrControl+Y'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cut',
            role: 'cut',
            accelerator: 'CommandOrControl+X'
          },
          {
            label: 'Copy',
            role: 'copy',
            accelerator: 'CommandOrControl+C'
          },
          {
            label: 'Paste',
            role: 'paste',
            accelerator: 'CommandOrControl+V'
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
            click: this.setWriterMode.bind(this),
            enabled: !!this._filepath
          },
          {
            label: 'Organize mode',
            type: 'radio',
            id: 'appMenuEditMode',
            click: this.setOrganizeMode.bind(this),
            enabled: !!this._filepath
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'View license',
            click: () => shell.openExternal(config.link.license)
          },
          {
            type: 'separator'
          },
          {
            label: 'Documetation',
            click: () => shell.openExternal(config.link.documentation)
          }
        ]
      }
    ]
  }

  setupApplicationMenu () {
    this._uiMenu = Menu.buildFromTemplate(this.ApplicationMenu)
    Menu.setApplicationMenu(this._uiMenu)
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
    this._dirtyState = true
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

  defaultSaving () {
    let notes = []
    for (let note of this._notes.values()) {
      notes.push(Note.Dump(note))
    }
    ipcRenderer.send(config.channel.save, {
      filepath: this._filepath,
      todoList: notes
    })
  }

  setMode (menuItem, stringId, inputVisibility) {
    menuItem.checked = true
    this._uiMenu.getMenuItemById(stringId).checked = false
    this._uiDefaultMode = inputVisibility
    this.UserInput.style.opacity = inputVisibility ? '1' : '0'
    return menuItem
  }

  setWriterMode (menuItem, _browserWindow, _event) {
    if (this._uiDefaultMode) {
      return // already in writer mode
    }

    let newItems = new Map()
    for (let i = 0; i < this.List.children.length; i++) {
      let item = this.List.children[i]
      if (!item.id) {
        let wrapper = item.querySelector('aside')
        let content = wrapper.querySelector('textarea').value.trim()
        newItems.set(item, content)
        wrapper.remove()
      }
    }

    for (let [item, text] of newItems.entries()) {
      let note = this._notes.get(item)
      if (text.length) {
        item.querySelector('label').textContent = text
        note.setMessage(text)
      } else {
        this._notes.delete(item)
        item.remove()
      }
    }

    return this.setMode(menuItem, `appMenuEditMode`, true)
  }

  setOrganizeMode (menuItem, _browserWindow, _event) {
    if (!this._uiDefaultMode) {
      return // already in organize mode
    }

    for (let i = 0; i < this.List.children.length; i++) {
      let item = this.List.children[i]
      if (!item.id) {
        let { textField } = this.createEditableItem(item)
        textField.addEventListener('keydown', async (e) => {
          if (e.charCode === UI.ENTER || e.which === UI.ENTER) {
            return e.preventDefault()
          }
          if (textField.value.length > this._textLimit) {
            document.body.classList.add('shake')
            setTimeout(() => {
              document.body.classList.remove('shake')
            }, 1000)
          } else {
            document.body.classList.remove('shake')
          }
          setTimeout(this.calcTextareaHeight, 0, textField)
        })
      }
    }

    return this.setMode(menuItem, `appMenuWriteMode`, false)
  }

  async callCreateBacklog (_event) {
    dialog.showSaveDialog(this.ButtonCreateOptions, async (filename) => {
      if (filename) {
        this._filepath = filename
        this.reset()
        ipcRenderer.send(config.channel.fileOpenWrite, this._filepath)
        this.refreshLayout(null, this._filepath)
        this.setupApplicationMenu()
      }
    })
  }

  async callOpenBacklog (_event) {
    dialog.showOpenDialog(this.ButtonOpenOptions, async (filePaths) => {
      if (filePaths && filePaths.length > 0) {
        this._filepath = filePaths.shift()
        this.reset()
        ipcRenderer.send(config.channel.fileOpenRead, this._filepath)
        this.refreshLayout(null, this._filepath)
        this.setupApplicationMenu()
      }
    })
  }

  async callSaveBacklog () {
    if (this._saveCallback !== null) {
      await this._saveCallback()
      this._lastSave = new Date()
      this._dirtyState = false
    } else {
      throw new Error(`Unregistered save callback is not supported`)
    }
  }

  async callSaveAsBacklog () {
    dialog.showSaveDialog(this.ButtonSaveOptions, async (filename) => {
      if (filename) {
        this._filepath = filename
        this.callSaveBacklog()
        this.refreshLayout(null, filename)
      }
    })
  }

  async autosave (saveInterval) {
    if (this._autosave === null) {
      let interval = 1000 * 60 * 5 // ms * sec * min
      if (saveInterval + 0 === saveInterval && saveInterval > 0) {
        interval = saveInterval
      }
      this._autosave = setInterval(async () => this.callSaveBacklog(), interval)
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
      this.reset()
    }
    if (filename && filename.length) {
      if (filename.endsWith('.notes')) {
        filename = filename.substring(0, filename.length - 6) // 6 chars in ".notes"
      }
      this.Title.textContent = filename
    }
  }

  reset () {
    this.List.innerHTML = ``
    this._notes = new Map()
    this.createUserInput()
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
