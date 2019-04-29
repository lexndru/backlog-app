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

const link = {

  // application documentation
  documentation: `http://github.com/lexndru/backlog-app`,

  // application license
  license: `http://github.com/lexndru/backlog-app/blob/master/LICENSE`

}

const channel = {

  // trigger by backend when something happends
  uiStatusBar: `ui-status`,

  // trigger by frontend when data must be saved to disk
  save: `save-backlog`,

  // trigger by backend when user closes application and data must be saved to disk
  saveConfirm: `save-confirm-backlog`,

  // trigger by backend when app is ready to show
  uiReady: `ui-ready`,

  // trigger by backend when app has created/opened a file
  refreshLayout: `refresh-backlog`,

  // trigger by backend when app has parsed all notes from file
  refreshTodoList: `refresh-todolist`,

  // trigger by frontend when user clicks on "open backlog" button
  fileOpenRead: `file-open-backlog`,

  // trigger by frontend when user clicks on "create backlog" button
  fileOpenWrite: `file-make-backlog`

}

module.exports = { link, channel }
