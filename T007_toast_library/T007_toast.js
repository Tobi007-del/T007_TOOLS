(function loadStyleSheet(src) {
    let link = document.createElement("link")
    link.href = src
    link.rel = "stylesheet"

    document.body.append(link)
})("/T007_TOOLS/T007_toast_library/T007_toast.css")

const DEFAULT_OPTIONS = {
    autoClose: 5000,
    position: "top-right",
    onClose: () => {}, 
    canClose: true,
    showProgress: true,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
}

export default class Toast {
    #toastElem
    #autoCloseInterval
    #progressInterval
    #removeBinded
    #timeVisible = 0
    #autoClose
    #isPaused = false
    #unpause 
    #pause
    #visiblityChange
    #shouldUnPause

    constructor(options) {
        this.#toastElem = document.createElement("div")
        this.#toastElem.classList.add("toast")
        requestAnimationFrame(() => this.#toastElem.classList.add("show"))
        this.#removeBinded = this.remove.bind(this)
        this.#unpause = () => this.#isPaused = false
        this.#pause = () => this.#isPaused = true
        this.#visiblityChange = () => this.#shouldUnPause = document.visibilityState === "visible"
        this.update({...DEFAULT_OPTIONS, ...options})
    }

    /**
     * @param {boolean} value
     */
    set autoClose(value) {
        this.#autoClose = value
        this.#timeVisible = 0
        if (value === false) return

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
        const selector = `.toast-container[data-position="${value}"]`
        const container = document.querySelector(selector) || this.createContainer(value)
        container.append(this.#toastElem)
        if (currentContainer == null || currentContainer.hasChildNodes) return 
        currentContainer.remove()
    }

    /**
     * @param {string} value
     */
    set text(value) {
        this.#toastElem.textContent = value
    }

    /**
     * @param {boolean} value
     */
    set canClose(value) {
        this.#toastElem.classList.toggle("can-close", value)
        value ? this.#toastElem.addEventListener('click', this.#removeBinded) : this.#toastElem.removeEventListener('click', this.#removeBinded)
    }
    
    /**
     * @param {boolean} value
     */
    set showProgress(value) {
        this.#toastElem.classList.toggle("progress", value)
        this.#toastElem.style.setProperty("--progress", 1)

        if (value) {
            const func = () => {
                if (!this.#isPaused) this.#toastElem.style.setProperty("--progress", 1 - this.#timeVisible / this.#autoClose)
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
     * @param {string} position 
     */
    createContainer(position) {
        const container = document.createElement("div")
        container.classList.add("toast-container")
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

    remove() {
        cancelAnimationFrame(this.#autoCloseInterval)
        cancelAnimationFrame(this.#progressInterval)
        const container = this.#toastElem.parentElement
        this.#toastElem.classList.remove("show")
        this.#toastElem.addEventListener("transitionend", () => {
            this.#toastElem.remove()
            if (container.hasChildNodes()) return 
            container.remove()
        })
        this.onClose()
    }
}










