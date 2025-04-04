const DEFAULT_OPTIONS = {
    autoClose: true,
    autoClose: true,
    position: "top-right",
    onClose: () => {}, 
    canClose: true,
    closeOnClick: false,
    dragToClose: true,
    showProgress: true,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    renotify: true,
    vibrate: false
},
TOAST_DURATIONS = {
    success: 2500,
    error: 4500,
    warning: 3500,
    info: 4000 // default
},
TOAST_VIBRATIONS = {
    success: [100, 50, 100], // Short double buzz
    warning: [300, 100, 300], // Two long buzzes
    error: [500, 200, 500], // Strong long buzz
    info: [200] // Single short buzz
}

let _STYLE_CACHE = {},
_SCRIPT_CACHE = {},
_ACTIVE_TOASTS = [];

function loadResource(src, type) {
switch (type) {
    case "script":
        _SCRIPT_CACHE[src] = _SCRIPT_CACHE[src] || new Promise(function (resolve, reject) {
            let script = document.createElement("script")
            script.src = src

            script.onload = () => resolve(script)
            script.onerror = () =>  reject(new Error(`Load error for T007 Toast JavaScript file`))

            document.body.append(script)
        })

        return _SCRIPT_CACHE[src]
    default:
        _STYLE_CACHE[src] = _STYLE_CACHE[src] || new Promise(function (resolve, reject) {
            let link = document.createElement("link")
            link.href = src
            link.rel = "stylesheet"
    
            link.onload = () => resolve(link)

            link.onerror = () =>  reject(new Error(`Load error for T007 Toast CSSStylesheet`))
    
            document.head.append(link)
        })
    
        return _STYLE_CACHE[src]
}
}
loadResource("/T007_TOOLS/T007_toast_library/T007_toast.css")

function clamp(min, amount, max) {
    return Math.min(Math.max(amount, min), max)
}

export default function Toast(options) {
    return new t007Toast(options)
}

class t007Toast {
    #toastElem
    #autoCloseInterval
    #progressInterval
    #timeVisible = 0
    #autoClose
    #vibrate
    #isPaused = false
    #unpause 
    #pause
    #visiblityChange
    #shouldUnPause
    #pointerStartX
    #pointerDeltaX
    #pointerRAF
    #pointerTicker = false

    constructor(options) {
        this.bindMethods()
        _ACTIVE_TOASTS.push(this)
        this.options = {...DEFAULT_OPTIONS, ...options}
        this.#toastElem = document.createElement("div")
        this.#toastElem.classList.add("t007-toast")
        requestAnimationFrame(() => this.#toastElem.classList.add("toast-show"))
        this.#unpause = () => this.#isPaused = false
        this.#pause = () => this.#isPaused = true
        this.#visiblityChange = () => this.#shouldUnPause = document.visibilityState === "visible"
        this.update(this.options)
    }

    bindMethods() {
        for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (method !== "constructor" && typeof Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), method).value === "function") this[method] = this[method].bind(this)
        }
    }    

    /**
     * @param {boolean | string} value
     */
    set autoClose(value) {
        if (value === false) return
        if (value === true) {
            switch (this.options.data.type) {
                case "success":
                case "error":
                case "warning": 
                    value = TOAST_DURATIONS[this.options.data.type]
                    break
                default:
                    value = TOAST_DURATIONS.info  
            }
        } 
        this.#autoClose = value
        this.#timeVisible = 0

        let lastTime
        const func = time => {
            if (this.#shouldUnPause) {
                lastTime = null
                this.#shouldUnPause = false
            }
            if (lastTime == null) {
                lastTime = time
                this.#autoCloseInterval = requestAnimationFrame(func)
                return
            }
            if (!this.#isPaused) {
                this.#timeVisible += time - lastTime
                if (this.#timeVisible >= this.#autoClose) {
                    this.remove()
                    return 
                }
            }

            lastTime = time
            this.#autoCloseInterval = requestAnimationFrame(func)
        }

        this.#autoCloseInterval = requestAnimationFrame(func)
    }

    /**
     * @param {string} value
     */
    set position(value) {
        const currentContainer = this.#toastElem.parentElement
        const selector = `.t007-toast-container[data-position="${value}"]`
        const container = document.querySelector(selector) || this.createContainer(value)
        container.append(this.#toastElem)
        if (currentContainer == null || currentContainer.hasChildNodes) return 
        currentContainer.remove()
    }

    /**
     * @param {object} value
     */
    set data({type, image, body}) {
        switch(type) {
            case "success":
                this.#toastElem.classList.add("success")
                break
            case "error":
                this.#toastElem.classList.add("error")
                break
            case "warning":
                this.#toastElem.classList.add("warning")
                break
            case "info": 
                this.#toastElem.classList.add("info")
                break
        }
        this.#toastElem.innerHTML = 
        `
            <div class="toast-image-wrapper">
                ${
                    image ?
                    `
                        <img class="toast-image" src="${image}" alt="toast-image">
                    ` : ``
                }
            </div>
            <span class="toast-body">
                <p class="toast-body-text">${body}</p>
            </span>
            <button title="Close" type="button" class="toast-cancel-button">&times;</button> 
        `
        this.#toastElem.querySelector(".toast-cancel-button").addEventListener("click", this.remove)
    }

    /**
     * @param {boolean} value
     */
    set canClose(value) {
        this.#toastElem.classList.toggle("can-close", value)
    }

    /**
     * @param {boolean} value
     */
    set closeOnClick(value) {
        value ? this.#toastElem.addEventListener("click", this.remove) : this.#toastElem.removeEventListener("click", this.remove)
    }

    /**
     * @param {boolean} value
     */
    set dragToClose(value) {
        if (value) {
            this.#toastElem.addEventListener('touchstart', this.handleToastPointerStart, {passive: false})
            this.#toastElem.addEventListener('touchend', this.handleToastPointerEnd)
        } else {
            this.#toastElem.removeEventListener('touchstart', this.handleToastPointerStart, {passive: false})
            this.#toastElem.removeEventListener('touchend', this.handleToastPointerEnd)
        }        
    }

     /**
     * @param {object} options
     */
    handleToastPointerStart(e) {
        if (e.touches?.length > 1) return
        e.stopImmediatePropagation()
        this.#pointerStartX = e.clientX ?? e.targetTouches[0]?.clientX
        this.#pointerTicker = false
        this.#toastElem.addEventListener('touchmove', this.handleToastPointerMove, {passive: false})
        this.#isPaused = true
    }
    
    /**
     * @param {object} options
     */
    handleToastPointerMove(e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (this.#pointerTicker) return
        this.#pointerRAF = requestAnimationFrame(() => {
            let x = e.clientX ?? e.targetTouches[0]?.clientX
            this.#pointerDeltaX = x - this.#pointerStartX
            this.#toastElem.style.setProperty("transition", "none", "important")
            this.#toastElem.style.setProperty("transform", `translateX(${this.#pointerDeltaX}px)`, "important")
            this.#toastElem.style.setProperty("opacity", clamp(0, 1 - (Math.abs(this.#pointerDeltaX) / this.#toastElem.offsetWidth), 1), "important")
            this.#pointerTicker = false
        })
        this.#pointerTicker = true
    }    

    /**
     * @param {object} options
     */
    handleToastPointerEnd() {
        cancelAnimationFrame(this.#pointerRAF)
        if (Math.abs(this.#pointerDeltaX) > (this.#toastElem.offsetWidth*0.4)) {
            this.remove("instant")
            return
        } 
        this.#pointerTicker = false
        this.#toastElem.removeEventListener('touchmove', this.handleToastPointerMove, {passive: false})
        this.#toastElem.style.removeProperty("transition")
        this.#toastElem.style.removeProperty("transform")
        this.#toastElem.style.removeProperty("opacity")
        this.#isPaused = false
    }    

    /**
     * @param {boolean} value
     */
    set showProgress(value) {
        this.#toastElem.classList.toggle("progress", value)
        this.#toastElem.style.setProperty("--progress", 1)

        if (value) {
            const func = () => {
                if (!this.#isPaused) this.#toastElem.style.setProperty("--progress", this.#timeVisible / this.#autoClose)
                this.#progressInterval = requestAnimationFrame(func)
            }

            this.#progressInterval = requestAnimationFrame(func)
        }
    }

    /**
     * @param {boolean} value
     */
    set pauseOnHover(value) {
        if (value) {
            this.#toastElem.addEventListener("mouseover", this.#pause)
            this.#toastElem.addEventListener("mouseleave", this.#unpause)
        } else {
            this.#toastElem.removeEventListener("mouseover", this.#pause)
            this.#toastElem.removeEventListener("mouseleave", this.#unpause) 
        }
    }

    /**
     * @param {boolean} value
     */
    set pauseOnFocusLoss(value) {
        value ? document.addEventListener("visibilitychange", this.#visiblityChange) : document.removeEventListener("visibilitychange", this.#visiblityChange)
    }

    /**
     * @param {boolean} value
     */
    set renotify(value) {
        if (!this.options.tag) return
        if (value) {
            _ACTIVE_TOASTS?.filter(toast => (toast !== this && ((toast.options.tag ?? 1) === (this.options.tag ?? 0))))?.forEach(toast => toast.remove("instant"))
        }
    }

    /**
     * @param {boolean|array|number} value
     */
    set vibrate(value) {
        if (!("vibrate" in navigator)) return
        if (value === false) return
        if (value === true) {
            switch (this.options.data.type) {
                case "success":
                case "error":
                case "warning": 
                    value = TOAST_VIBRATIONS[this.options.data.type]
                    break
                default:
                    value = TOAST_VIBRATIONS.info  
            }
        }
        this.#vibrate = value
        navigator.vibrate(this.#vibrate)
    }

    /**
     * @param {string} position 
     */
    createContainer(position) {
        const container = document.createElement("div")
        container.classList.add("t007-toast-container")
        container.dataset.position = position
        document.body.append(container)
        return container
    }

    /**
     * @param {object} options
     */
    update(options) {
        Object.entries(options).forEach(([key, value]) => this[key] = value)
    }

    cleanUpToast() {
        const container = this.#toastElem.parentElement
        this.#toastElem.remove()
        if (container?.hasChildNodes()) return 
        container?.remove()
    }

    remove(manner = "smooth") {
        cancelAnimationFrame(this.#autoCloseInterval)
        cancelAnimationFrame(this.#progressInterval)
        if (manner === "instant") this.cleanUpToast()
        else this.#toastElem.addEventListener("animationend", () => this.cleanUpToast())
        this.#toastElem.classList.remove("toast-show")
        this.onClose()
        _ACTIVE_TOASTS = _ACTIVE_TOASTS.filter(toast => toast !== this)
    }
}