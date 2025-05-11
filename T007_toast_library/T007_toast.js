window.TOAST_DEFAULT_OPTIONS = {
    autoClose: window.TOAST_DEFAULT_OPTIONS?.autoClose ?? true,
    position: window.TOAST_DEFAULT_OPTIONS?.position ?? "top-right",
    onClose: window.TOAST_DEFAULT_OPTIONS?.onClose ?? function() {}, 
    canClose: window.TOAST_DEFAULT_OPTIONS?.canClose ?? true,
    closeOnClick: window.TOAST_DEFAULT_OPTIONS?.closeOnClick ?? false,
    dragToClose: window.TOAST_DEFAULT_OPTIONS?.dragToClose ?? true,
    showProgress: window.TOAST_DEFAULT_OPTIONS?.showProgress ?? true,
    pauseOnHover: window.TOAST_DEFAULT_OPTIONS?.pauseOnHover ?? true,
    pauseOnFocusLoss: window.TOAST_DEFAULT_OPTIONS?.pauseOnFocusLoss ?? true,
    renotify: window.TOAST_DEFAULT_OPTIONS?.renotify ?? true,
    vibrate: window.TOAST_DEFAULT_OPTIONS?.vibrate ?? false
}
window.TOAST_DURATIONS = {
    success: window.TOAST_DURATIONS?.success ?? 2500,
    error: window.TOAST_DURATIONS?.error ?? 4500,
    warning: window.TOAST_DURATIONS?.warning ?? 3500,
    info: window.TOAST_DURATIONS?.info ?? 4000 // default
}
window.TOAST_VIBRATIONS = {
    success: window.TOAST_VIBRATIONS?.success ?? [100, 50, 100], // Short double buzz
    warning: window.TOAST_VIBRATIONS?.warning ?? [300, 100, 300], // Two long buzzes
    error: window.TOAST_VIBRATIONS?.error ?? [500, 200, 500], // Strong long buzz
    info: window.TOAST_VIBRATIONS?.info ?? [200] // Single short buzz
}

let _ACTIVE_TOASTS = []
const _RESOURCE_CACHE = {}
function loadResource(src, type = "style", options = {}) {
    const { module = false, media = null, crossorigin = null, integrity = null, } = options
    if (_RESOURCE_CACHE[src]) return _RESOURCE_CACHE[src]
    const isLoaded = (() => {
        if (type === "script") {
        return Array.from(...document.scripts)?.some(s => s.src?.includes(src))
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
loadResource(`/T007_TOOLS/T007_toast_library/T007_toast.css`)

function clamp(min, amount, max) {
    return Math.min(Math.max(amount, min), max)
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
        this.options = {...window.TOAST_DEFAULT_OPTIONS, ...options}
        this.#toastElem = document.createElement("div")
        this.#toastElem.classList.add("t007-toast")
        requestAnimationFrame(() => this.#toastElem.classList.add("t007-toast-show"))
        this.#unpause = () => this.#isPaused = false
        this.#pause = () => this.#isPaused = true
        this.#visiblityChange = () => this.#shouldUnPause = document.visibilityState === "visible"
        this.update(this.options)
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
                    value = window.TOAST_DURATIONS[this.options.data.type]
                    break
                default:
                    value = window.TOAST_DURATIONS.info  
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
            <div class="t007-toast-image-wrapper">
                ${image ? `<img class="t007-toast-image" src="${image}" alt="toast-image">` : ``}
            </div>
            <span class="t007-toast-body">
                <p class="t007-toast-body-text">${body}</p>
            </span>
            <button title="Close" type="button" class="t007-toast-cancel-button">&times;</button> 
        `
        this.#toastElem.querySelector(".t007-toast-cancel-button").addEventListener("click", this.remove)
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
                    value = window.TOAST_VIBRATIONS[this.options.data.type]
                    break
                default:
                    value = window.TOAST_VIBRATIONS.info  
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
        this.#toastElem.classList.remove("t007-toast-show")
        this.onClose()
        _ACTIVE_TOASTS = _ACTIVE_TOASTS.filter(toast => toast !== this)
    }
}

export default function Toast(options) {
    return new t007Toast(options)
}