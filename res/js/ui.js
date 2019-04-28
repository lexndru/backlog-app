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

/**
 * UI
 */
class UI {
  constructor () {
    this._context = document.getElementById('context')
    this._loader = document.getElementById('loader')
    this._title = document.createElement('h1')
    this._todoList = document.createElement('ul')
    this._container = document.createElement('main')
    this._createBtn = document.createElement('button')
    this._browseBtn = document.createElement('button')
    this._userInput = document.createElement('textarea')
  }

  get Context () {
    return this._context
  }

  get Loader () {
    return this._loader
  }

  get Title () {
    return this._title
  }

  get List () {
    return this._todoList
  }

  get ButtonNew () {
    return this._createBtn
  }

  get ButtonOpen () {
    return this._browseBtn
  }

  get UserInput () {
    return this._userInput
  }

  createLayout () {
    let wrapper = document.createElement('div')
    wrapper.className = `ui large buttons inverted`
    wrapper.appendChild(this._createBtn)
    wrapper.appendChild(this._browseBtn)

    let header = document.createElement('header')
    header.appendChild(this._title)
    header.appendChild(wrapper)

    this._createBtn.className = `ui button basic inverted`
    this._createBtn.textContent = 'New backlog'
    this._createBtn.setAttribute(`data-tooltip`, `Choose a directory to save your project backlog`)
    this._createBtn.setAttribute(`data-position`, `bottom center`)

    this._browseBtn.className = `ui button basic inverted`
    this._browseBtn.textContent = 'Open backlog'
    this._browseBtn.setAttribute(`data-tooltip`, `Browse for an existing project backlog`)
    this._browseBtn.setAttribute(`data-position`, `bottom center`)

    this._context.appendChild(header)
    this._context.appendChild(this._container)

    this._container.setAttribute('role', 'container')
    this._container.appendChild(this._todoList)

    this._todoList.setAttribute('role', 'content')

    this._title.textContent = `Personal Backlog`
  }

  createUserInput () {
    let item = document.createElement('li')
    item.appendChild(this._userInput)
    item.id = `userInput`
    this._userInput.placeholder = `Start typing your idea...`
    this._todoList.appendChild(item)
  }

  resetUserInput () {
    this._userInput.value = ``
  }

  refreshUserInput (limit) {
    let proc = Number(this._userInput.value.length / (limit || 1)).toFixed(2)
    let width = parseInt(proc * this._userInput.offsetWidth)
    let color = 'orange'
    if (proc >= 0.1 && proc < 0.21) {
      color = 'yellowgreen'
    } else if (proc >= 0.21 && proc < 0.91) {
      color = 'limegreen'
    } else if (proc > 0.99) {
      color = 'red'
    }
    this._userInput.parentElement.style = `--width:${width}px;--color:${color};`
  }

  createListItem (textMessage, isChecked, nodeId) {
    let input = document.createElement('input')
    input.type = `checkbox`
    input.id = nodeId

    let label = document.createElement('label')
    label.setAttribute('for', input.id)
    label.textContent = textMessage

    let wrapper = document.createElement('div')
    wrapper.appendChild(input)
    wrapper.appendChild(label)
    wrapper.className = `ui checkbox`

    let item = document.createElement('li')
    item.appendChild(wrapper)

    if (isChecked) {
      item.setAttribute('data-done', 'true')
      input.setAttribute(`checked`, true)
    } else {
      item.setAttribute('data-done', 'false')
      input.removeAttribute(`checked`)
    }

    return { wrapper, item }
  }

  appendToList (item) {
    if (item !== null) {
      let lastIndex = this._todoList.children.length - 1
      let lastNode = this._todoList.children[lastIndex]
      if (lastNode && lastNode.id === `userInput`) {
        this._todoList.insertBefore(item, lastNode)
      } else {
        this._todoList.appendChild(item)
      }
    }
  }

  static get ENTER () {
    return 13
  }
}

module.exports = { UI }
