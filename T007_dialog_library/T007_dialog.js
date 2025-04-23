export function Alert(message) {
    return new Promise(resolve => new t007AlertDialog({ message, resolve }))
}

export function Confirm(question) {
    return new Promise(resolve => new t007ConfirmDialog({ question, resolve }))
}

export function Prompt(question, defaultValue, fieldOptions) {
    return new Promise(resolve => new t007PromptDialog({ question, defaultValue, fieldOptions, resolve }))
}

const _RESOURCE_CACHE = {}
function loadResource(src, type = "style", options = {}) {
    const { module = false, media = null, crossorigin = null, integrity = null, } = options
    if (_RESOURCE_CACHE[src]) return _RESOURCE_CACHE[src]
    const isLoaded = (() => {
        if (type === "script") {
        return [...document.scripts].some(s => s.src.includes(src))
        } else if (type === "style") {
        return [...document.styleSheets].some(s => s.href.includes(src))
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
loadResource(`/T007_TOOLS/T007_dialog_library/T007_dialog.css`)
loadResource(`/T007_TOOLS/T007_input_library/T007_input.js`, "script")

class dialog {
    dialog
    confirmBtn
    cancelBtn
    constructor(resolve) {
        this.bindMethods()
        this.resolve = resolve
        this.dialog = document.createElement("dialog")
        this.dialog.classList.add("t007-dialog")
        document.body.append(this.dialog)
        document.addEventListener("keyup", this.handleKeyUp)
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
        document.removeEventListener("keyup", this.handleKeyUp)
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

    handleKeyUp(e) {
        const key = e.key.toString().toLowerCase() 
        if (document.activeElement.tagName === 'INPUT') return
        switch(key) {
            case "escape":
                this.cancel()
                break
        }
    }
}

class t007AlertDialog extends dialog {
    constructor({ message, resolve }) {
        super(resolve)
        this.render(message)
        this.show()        
    }
        
    render(message) {
        this.dialog.innerHTML =  
        `
            <div class="t007-dialog-top-section">
                <p class="t007-dialog-question">${message}</p>
            </div>
            <div class="t007-dialog-bottom-section">
                <button class="t007-dialog-confirm-button" type="button" title="OK">OK</button>
            </div>
        `
        this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button")
        this.confirmBtn.addEventListener("click", this.confirm)
    }
}

class t007ConfirmDialog extends dialog {
    constructor({ question, resolve }) {
        super(resolve)
        this.render(question)
        this.show()
    }

    render(question) {
        this.dialog.innerHTML =  
        `
            <div class="t007-dialog-top-section">
                <p class="t007-dialog-question">${question}</p>
            </div>
            <div class="t007-dialog-bottom-section">
                <button class="t007-dialog-confirm-button" type="button" title="OK">OK</button>
                <button class="t007-dialog-cancel-button" type="button" title="Cancel">Cancel</button>
            </div>
        `
        this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button")
        this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button")
        this.confirmBtn.addEventListener("click", this.confirm)
        this.cancelBtn.addEventListener("click", this.cancel)
    }
}

class t007PromptDialog extends dialog {
    constructor({ question, defaultValue, fieldOptions, resolve }) {
        super(resolve)
        this.render(question, defaultValue, fieldOptions)
        this.show()
    }

    render(question, defaultValue, fieldOptions = {}) {
        this.dialog.innerHTML =  
        `
            <div class="t007-dialog-top-section">
                <p class="t007-dialog-question">${question}</p>
            </div>
            <div class="t007-dialog-bottom-section">
                <button class="t007-dialog-confirm-button" type="button" title="OK">OK</button>
                <button class="t007-dialog-cancel-button" type="button" title="Cancel">Cancel</button>
            </div>
        `
        this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button")
        this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button")
        this.confirmBtn.addEventListener("click", this.confirm)
        this.cancelBtn.addEventListener("click", this.cancel)

        this.dialog.classList.add("input-form")
        fieldOptions.value = defaultValue
        this.field = createField(fieldOptions)
        this.input = this.field.querySelector(".input")
        this.input.addEventListener("keydown", ({ key }) => key?.toLowerCase() === "enter" && this.confirm())
        this.dialog.insertBefore(this.field, this.dialog.querySelector(".t007-dialog-bottom-section"))
        window.handleFormValidation(this.dialog)
    }

    show() {
        this.dialog.showModal()
        this.input.focus()
        this.input.select()
    }

    confirm() {
        if (!window.validateForm2OnClient()) return
        this.remove()
        this.resolve(this.input.value)
    }

    cancel() {
        this.remove()
        this.resolve(null)
    }
}