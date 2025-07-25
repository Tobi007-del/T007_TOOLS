export function Alert(message, options) {
  return new Promise(resolve => new t007AlertDialog({ message, resolve, options }))
}

export function Confirm(question, options) {
  return new Promise(resolve => new t007ConfirmDialog({ question, resolve, options }))
}

export function Prompt(question, defaultValue, options) {
  return new Promise(resolve => new t007PromptDialog({ question, defaultValue, resolve, options }))
}

if (typeof window !== "undefined") {
  window.Alert = Alert
  window.Confirm = Confirm
  window.Prompt = Prompt
  console.log("%cT007 Dialogs attached to window!", "color: green")
}

const _RESOURCE_CACHE = {}
function loadResource(src, type = "style", options = {}) {
  const { module = false, media = null, crossorigin = null, integrity = null, } = options
  if (_RESOURCE_CACHE[src]) return _RESOURCE_CACHE[src]
  const isLoaded = (() => {
    if (type === "script") {
    return Array.from(document.scripts)?.some(s => s.src?.includes(src))
    } else if (type === "style") {
    return Array.from(document.styleSheets)?.some(s => s.href?.includes(src))
    }
    return false
  })()
  if (isLoaded) return Promise.resolve(null) 
  _RESOURCE_CACHE[src] = new Promise((resolve, reject) => {
    if (type === "script") {
      const script = document.createElement("script")
      script.src = src
      if (module) script.type = "module"
      if (crossorigin) script.crossOrigin = crossorigin
      if (integrity) script.integrity = integrity
      script.onload = () => resolve(script)
      script.onerror = () => reject(new Error(`Script load error: ${src}`))
      document.body.append(script)
    } else if (type === "style") {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = src
      if (media) link.media = media
      link.onload = () => resolve(link)
      link.onerror = () => reject(new Error(`Stylesheet load error: ${src}`))
      document.head.append(link)
    } else {
      reject(new Error(`Unsupported type: ${type}`))
    }
  })
  return _RESOURCE_CACHE[src]
}
loadResource(window.T007_DIALOG_CSS_SRC || `/T007_TOOLS/T007_dialog_library/T007_dialog.css`)
loadResource(window.T007_INPUT_JS_SRC || `/T007_TOOLS/T007_input_library/T007_input.js`, "script")

class dialog {
  dialog
  confirmBtn
  cancelBtn
  constructor(resolve) {
    this.bindMethods()
    this.resolve = resolve
    this.dialog = document.createElement("dialog")
    this.dialog.closedBy = "any"
    this.dialog.classList.add("t007-dialog")
    document.body.append(this.dialog)
    this.dialog.addEventListener("cancel", this.cancel)
  } 

  bindMethods() {
    let proto = Object.getPrototypeOf(this)
    while (proto && proto !== Object.prototype) {
      for (const method of Object.getOwnPropertyNames(proto)) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, method)
        if (method !== "constructor" && descriptor && typeof descriptor.value === "function") this[method] = this[method].bind(this)
      }
      proto = Object.getPrototypeOf(proto)
    }
  }

  show() {
    this.dialog.showModal()
    this.confirmBtn.focus()
  }

  remove() {
    this.dialog.close()
    this.dialog.remove()
  }

  confirm() {
    this.remove()
    this.resolve(true)
  }

  cancel() {
    this.remove()
    this.resolve(false)
  }
}

class t007AlertDialog extends dialog {
  constructor({ message, resolve, options }) {
    super(resolve)
    this.render(message, options)
    this.show()      
  }
    
  render(message, options = {}) {
    this.dialog.innerHTML =  
    `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${message}</p>
      </div>
      <div class="t007-dialog-bottom-section">
        <button class="t007-dialog-confirm-button" type="button">${options.confirmText || 'OK'}</button>
      </div>
    `
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button")
    this.confirmBtn.addEventListener("click", this.confirm)
  }
}

class t007ConfirmDialog extends dialog {
  constructor({ question, resolve, options }) {
    super(resolve)
    this.render(question, options)
    this.show()
  }

  render(question, options = {}) {
    this.dialog.innerHTML =  
    `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${question}</p>
      </div>
      <div class="t007-dialog-bottom-section">
        <button class="t007-dialog-confirm-button" type="button">${options.confirmText || 'OK'}</button>
        <button class="t007-dialog-cancel-button" type="button">${options.cancelText || 'Cancel'}</button>
      </div>
    `
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button")
    this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button")
    this.confirmBtn.addEventListener("click", this.confirm)
    this.cancelBtn.addEventListener("click", this.cancel)
  }
}

class t007PromptDialog extends dialog {
  constructor({ question, defaultValue, resolve, options }) {
    super(resolve)
    this.render(question, defaultValue, options)
    this.show()
  }

  render(question, defaultValue, options = {}) {
    this.dialog.innerHTML =  
    `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${question}</p>
      </div>
      <form class="t007-input-form" novalidate>
      </form>
      <div class="t007-dialog-bottom-section">
        <button class="t007-dialog-confirm-button" type="submit">${options.confirmText || 'OK'}</button>
        <button class="t007-dialog-cancel-button" type="button">${options.cancelText || 'Cancel'}</button>
      </div>
    `
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button")
    this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button")
    this.confirmBtn.addEventListener("click", this.confirm)
    this.cancelBtn.addEventListener("click", this.cancel)

    delete options.confirmText
    delete options.cancelText
    options.value = defaultValue
    this.form = this.dialog.querySelector("form")
    this.field = createField(options)
    this.input = this.field.querySelector(".t007-input")
    this.form.addEventListener("submit", e => {
      e.preventDefault()
      e.stopImmediatePropagation()
      this.confirm()
    })
    this.form.appendChild(this.field)
    window.handleFormValidation(this.form)
  }

  show() {
    this.dialog.showModal()
    this.input.focus()
    this.input.select?.()
  }

  confirm() {
    if (!this.form.validateOnClient?.()) return
    this.remove()
    this.resolve(this.input.value)
  }

  cancel() {
    this.remove()
    this.resolve(null)
  }
}