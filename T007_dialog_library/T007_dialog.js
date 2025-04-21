export function Alert(message) {
    return new Promise(resolve => new t007AlertDialog({ message, resolve }))
}

export function Confirm(question) {
    return new Promise(resolve => new t007ConfirmDialog({ question, resolve }))
}

let _STYLE_CACHE = {},
_SCRIPT_CACHE = {}

function loadResource(src, type) {
switch (type) {
    case "script":
        _SCRIPT_CACHE[src] = _SCRIPT_CACHE[src] || new Promise(function (resolve, reject) {
            let script = document.createElement("script")
            script.src = src

            script.onload = () => resolve(script)
            script.onerror = () =>  reject(new Error(`Load error for T007 Dialog JavaScript file`))

            document.body.append(script)
        })

        return _SCRIPT_CACHE[src]
    default:
        _STYLE_CACHE[src] = _STYLE_CACHE[src] || new Promise(function (resolve, reject) {
            let link = document.createElement("link")
            link.href = src
            link.rel = "stylesheet"
    
            link.onload = () => resolve(link)

            link.onerror = () =>  reject(new Error(`Load error for T007 Dialog CSS Stylesheet`))
    
            document.head.append(link)
        })
    
        return _STYLE_CACHE[src]
}
}
loadResource(`/T007_TOOLS/T007_dialog_library/T007_dialog.css`)

class dialog {
    dialog
    confirmBtn
    cancelBtn
    resolve
    constructor(resolve) {
        this.bindMethods()
        this.resolve = resolve
        this.dialog = document.createElement("dialog")
        this.dialog.classList.add("t007-dialog")
        document.body.append(this.dialog)
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
        document.addEventListener("keyup", this.handleKeyUp)
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