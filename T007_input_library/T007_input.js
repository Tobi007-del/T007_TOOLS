class T007_Form_Manager {
  static forms = document.getElementsByClassName("t007-input-form")

  static violationKeys = ["valueMissing", "typeMismatch", "patternMismatch", "stepMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "badInput", "customError"]

  static _RESOURCE_CACHE = {}

  static init() {
    window.t007FM.mountWindow()
    window.t007FM.observeDOMForFields()
    window.t007FM.loadResource(window.T007_INPUT_CSS_SRC || `/T007_TOOLS/T007_input_library/T007_input.css`)
    Array.from(window.t007FM.forms).forEach((form, n) => window.t007FM.handleFormValidation(form, n))
  }

  static mountWindow() {
    window.createField = window.t007FM.createField
    window.handleFormValidation = window.t007FM.handleFormValidation
  }

  static loadResource(src, type = "style", options = {}) {
    const { module = false, media = null, crossorigin = null, integrity = null, } = options
    if (window.t007FM._RESOURCE_CACHE[src]) return window.t007FM._RESOURCE_CACHE[src]
    const isLoaded = (() => {
      if (type === "script") {
      return Array.from(document.scripts)?.some(s => s.src?.includes(src))
      } else if (type === "style") {
      return Array.from(document.styleSheets)?.some(s => s.href?.includes(src))
      }
      return false
    })()
    if (isLoaded) return Promise.resolve(null) 
    window.t007FM._RESOURCE_CACHE[src] = new Promise((resolve, reject) => {
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
    return window.t007FM._RESOURCE_CACHE[src]
  }

  static observeDOMForFields() {
    (new MutationObserver(mutations => {
    for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue
      if (node?.classList?.contains("t007-input-field") || node?.querySelector(".t007-input-field")) {
        const fields = [...(node.classList.contains("t007-input-field") ? [node] : node.querySelectorAll(".t007-input-field"))]
        for (const field of fields) {
          window.t007FM.setUpField(field)
        }
      }
    }
    }
    })).observe(document.body, {childList: true, subtree: true})
  }

  static convertFileSize(size) {
    const units = ["B","KB","MB","GB","TB","PB","EB","ZB","YB",]
    const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1e3)), units.length - 1)
    const approx = size / 1e3 ** exponent
    return exponent === 0 ? `${size} byte${size>1?'s':''}` : `${approx} ${units[exponent]}`
  }

  static togglePasswordType(input) {
    input.type = input.type === "password" ? "text" : "password"
  }

  static autoFitNotch(field) {
    const notch = field?.querySelector(".t007-input-outline-notch")
    if (!notch) return
    const label = notch.firstElementChild
    if (!label.innerText) return
    const style = getComputedStyle(label)
    const span = document.createElement('span')
    span.style.setProperty("visibility", "hidden", "important")
    span.style.setProperty("position", "absolute", "important")
    span.style.setProperty("whiteSpace", "nowrap", "important")
    span.style.setProperty("display", "inline", "important")
    span.style.setProperty("font-size", style.getPropertyValue("--t007-input-floating-label-font-size"), "important")
    span.style.setProperty("font-family", style.fontFamily, "important")
    span.innerText = label.innerText
    document.body.appendChild(span)
    const width = span.getBoundingClientRect().width
    document.body.removeChild(span)
    notch.style.width = `${(width + 8)/getComputedStyle(document.documentElement).fontSize.replace("px", "")}rem` // Add small padding
  }

  static toggleFilled(input) {
    if (!input) return
    const isFilled = input.type === "checkbox" || input.type === "radio" ? input.checked : input.value !== '' || input.files?.length > 0
    input.toggleAttribute("data-filled", isFilled)
  }

  static setFallbackHelper(field) {
    const helperLine = field?.querySelector(".t007-input-helper-line")
    if (!helperLine || helperLine.querySelector(".t007-input-helper-text[data-violation='auto']")) return
    const el = document.createElement('p')
    el.className = 't007-input-helper-text'
    el.setAttribute('data-violation', "auto")
    helperLine.appendChild(el)
  }

  static setFieldListeners(field) {
    if (!field) return
    const input = field.querySelector(".t007-input"),
    floatingLabel = field.querySelector(".t007-input-floating-label"),
    eyeOpen = field.querySelector(".t007-input-password-visible-icon"),
    eyeClosed = field.querySelector(".t007-input-password-hidden-icon") 
    if (input.type === "file") input.addEventListener("input", async () => {
      const file = input.files?.[0],
      img = new Image()
      img.onload = () => {
        input.style.setProperty("--t007-input-image-src", `url(${src})`)
        input.classList.add("image-selected")
        setTimeout(() => URL.revokeObjectURL(src), 1000)
      }
      img.onerror = () => {
        input.style.removeProperty("--t007-input-image-src")
        input.classList.remove("t007-image-selected")
        URL.revokeObjectURL(src)
      }
      let src
      if (file?.type?.startsWith("image")) {
        src = URL.createObjectURL(file)
      } else if (file?.type?.startsWith("video")) {
        src = await new Promise(resolve => {
          let video = document.createElement("video"),
          canvas = document.createElement("canvas"),
          context = canvas.getContext("2d")               
          video.ontimeupdate = () => {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
            canvas.toBlob(blob => resolve(URL.createObjectURL(blob)))
            URL.revokeObjectURL(video.src)
            video = video.src = video.onloadedmetadata = video.ontimeupdate = null
          }
          video.onloadeddata = () => video.currentTime = 3
          video.src = URL.createObjectURL(file)
        })
      }
      if (!src) {
        input.style.removeProperty("--t007-input-image-src")
        input.classList.remove("t007-image-selected")
        return
      }
      img.src = src
    })
    if (floatingLabel) floatingLabel.ontransitionend = () => floatingLabel.classList.remove("t007-input-shake")
    if (eyeOpen && eyeClosed) eyeOpen.onclick = eyeClosed.onclick = () => window.t007FM.togglePasswordType(input)
  }

  static setUpField(field) {
    window.t007FM.toggleFilled(field.querySelector(".t007-input"))
    window.t007FM.autoFitNotch(field)
    window.t007FM.setFallbackHelper(field)
    window.t007FM.setFieldListeners(field)
  }

  // Field Builder Utility
  static createField({
    type = 'text',
    value = '',
    id = '',
    name = '',
    custom = '',
    label = '',
    placeholder = '',
    checked,
    required,
    autocomplete = 'off',
    pattern,
    minLength,
    maxLength,
    minSize,
    maxSize,
    min,
    max,
    step,
    accept,
    options = [], // an array for when the input is select
    eyeToggler = true, // a boolean for only input type = "password"
    passwordMeter = true, // a boolean for only input type = "password"
    helperText = {} // { info, valueMissing, typeMismatch, patternMismatch, etc. }
  }) {
    const field = document.createElement('div')
    field.className = 't007-input-field'

    const inputField = document.createElement('label')
    inputField.className = ["checkbox", "radio"].includes(type) ? `t007-input-${type}-wrapper` : 't007-input-wrapper'
    if (id) inputField.htmlFor = id
    field.appendChild(inputField)

    if (["checkbox", "radio"].includes(type)) {
    inputField.innerHTML = 
    `
    <span class="t007-input-${type}-box">
      <span class="t007-input-${type}-tag"></span>
    </span>
    <span class="t007-input-${type}-label">${label}</span>   
    `
    } else {
    const inputOutline = document.createElement('span')
    inputOutline.className = 't007-input-outline'
    inputOutline.innerHTML = 
    `
    <span class="t007-input-outline-leading"></span>
    <span class="t007-input-outline-notch">
      <span class="t007-input-floating-label">${label}</span>
    </span>
    <span class="t007-input-outline-trailing"></span>
    `
    inputField.appendChild(inputOutline)
    }

    const input = document.createElement(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input')
    input.className = 't007-input'
    if (['checkbox, radio'].includes(type)) input.value = label
    if (!['select', 'textarea'].includes(type)) input.type = type
    input.name = name
    input.custom = custom && input.setAttribute("custom", custom)
    input.placeholder = placeholder
    input.autocomplete = autocomplete
    if (value ?? false) input.value = value
    if (checked ?? false) input.checked = checked
    if (id ?? false) input.id = id
    if (required ?? false) input.required = true
    if (pattern ?? false) input.pattern = pattern
    if (minLength ?? false) input.minLength = minLength
    if (maxLength ?? false) input.maxLength = maxLength
    if (minSize ?? false) input.minSize = minSize && input.setAttribute("minsize", minSize)
    if (maxSize ?? false) input.maxSize = maxSize && input.setAttribute("maxsize", maxSize)
    if (min ?? false) input.min = min
    if (max ?? false) input.max = max
    if (step ?? false) input.step = step   
    if (accept ?? false) input.accept = accept
    if (type === 'select') input.innerHTML = options.length && options.map(option => `<option value="${option}">${option}</option>`).join('')
    inputField.appendChild(input)

    if (eyeToggler && type === 'password') {
    const eyeOpen = document.createElement("i")
    eyeOpen.className = "t007-input-icon t007-input-password-visible-icon"
    eyeOpen.innerHTML = 
    `
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <path fill="rgba(0,0,0,.54)" d="M12 16q1.875 0 3.188-1.312Q16.5 13.375 16.5 11.5q0-1.875-1.312-3.188Q13.875 7 12 7q-1.875 0-3.188 1.312Q7.5 9.625 7.5 11.5q0 1.875 1.312 3.188Q10.125 16 12 16Zm0-1.8q-1.125 0-1.912-.788Q9.3 12.625 9.3 11.5t.788-1.913Q10.875 8.8 12 8.8t1.913.787q.787.788.787 1.913t-.787 1.912q-.788.788-1.913.788Zm0 4.8q-3.65 0-6.65-2.038-3-2.037-4.35-5.462 1.35-3.425 4.35-5.463Q8.35 4 12 4q3.65 0 6.65 2.037 3 2.038 4.35 5.463-1.35 3.425-4.35 5.462Q15.65 19 12 19Z"></path>
    </svg>   
    `
    eyeOpen.setAttribute("aria-label", "Show password")
    inputField.appendChild(eyeOpen)
    const eyeClosed = document.createElement("i")
    eyeClosed.className = "t007-input-icon t007-input-password-hidden-icon"
    eyeClosed.innerHTML = 
    `
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <path fill="rgba(0,0,0,.54)" d="m19.8 22.6-4.2-4.15q-.875.275-1.762.413Q12.95 19 12 19q-3.775 0-6.725-2.087Q2.325 14.825 1 11.5q.525-1.325 1.325-2.463Q3.125 7.9 4.15 7L1.4 4.2l1.4-1.4 18.4 18.4ZM12 16q.275 0 .512-.025.238-.025.513-.1l-5.4-5.4q-.075.275-.1.513-.025.237-.025.512 0 1.875 1.312 3.188Q10.125 16 12 16Zm7.3.45-3.175-3.15q.175-.425.275-.862.1-.438.1-.938 0-1.875-1.312-3.188Q13.875 7 12 7q-.5 0-.938.1-.437.1-.862.3L7.65 4.85q1.025-.425 2.1-.638Q10.825 4 12 4q3.775 0 6.725 2.087Q21.675 8.175 23 11.5q-.575 1.475-1.512 2.738Q20.55 15.5 19.3 16.45Zm-4.625-4.6-3-3q.7-.125 1.288.112.587.238 1.012.688.425.45.613 1.038.187.587.087 1.162Z"></path>
    </svg>   
    `
    eyeClosed.setAttribute("aria-label", "Hide password")
    inputField.appendChild(eyeClosed)
    }

    const helperLine = document.createElement('div')
    helperLine.className = 't007-input-helper-line'
    //info helper
    if (helperText.info) {
    const infoText = document.createElement('p')
    infoText.className = 't007-input-helper-text'
    el.setAttribute('data-violation', "none")
    helperLine.appendChild(infoText)
    }
    //violation helpers
    window.t007FM.violationKeys.forEach(key => {
    if (!helperText[key]) return
    const el = document.createElement('p')
    el.className = 't007-input-helper-text'
    el.setAttribute('data-violation', key)
    el.textContent = helperText[key]
    helperLine.appendChild(el)
    })
    field.appendChild(helperLine)

    if (passwordMeter && type === 'password') {
    const meter = document.createElement('div')
    meter.className = 't007-input-password-meter'
    meter.dataset.strengthLevel = '1'
    const strengthMeter = document.createElement('div')
    strengthMeter.className = 't007-input-password-strength-meter'
    strengthMeter.innerHTML = `
    <div class="t007-input-p-weak"></div>
    <div class="t007-input-p-fair"></div>
    <div class="t007-input-p-strong"></div>
    <div class="t007-input-p-very-strong"></div>
    `
    meter.appendChild(strengthMeter)
    field.appendChild(meter)   
    }

    return field
  }

  static handleFormValidation(form, n) {
    if (!form?.classList.contains("t007-input-form") || form.dataset?.isValidating) return

    form.dataset.isValidating = true
    form.validateOnClient = validateFormOnClient
    form.toggleGlobalError = toggleFormGlobalError

    const fields = form.getElementsByClassName("t007-input-field"),
    inputs = form.getElementsByClassName("t007-input")

    Array.from(fields).forEach(window.t007FM.setUpField)

    form.addEventListener("input", ({ target }) => {
      window.t007FM.toggleFilled(target)
      validateInput(target)
    })

    form.addEventListener("focusout", ({ target }) => validateInput(target, true))

    form.addEventListener("submit", async e => {
      toggleSubmitLoader(true)
      try {
        e.preventDefault()
        if (!validateFormOnClient()) return
        if (form.validateOnServer && !await form.validateOnServer()) {
         toggleFormGlobalError(form, true)
          form.addEventListener("input", () => toggleFormGlobalError(form, false), { once: true, useCapture: true })
          return
        } 
        form.submit()
      } catch(error) {
        console.error(error)
      } finally {
        toggleSubmitLoader(false)
      }
    })

    function toggleSubmitLoader(bool) {
      form.classList.toggle("t007-input-submit-loading", bool)
    }

    function toggleError(input, bool, notify = false) {
      const field = input.closest(".t007-input-field"),
      floatingLabel = field.querySelector(".t007-input-floating-label")
      if (bool && notify) {
        field?.classList.add("t007-input-error")
        toggleHelper(input, true)
        floatingLabel?.classList.add("t007-input-shake")
      } else if (!bool) {
        field?.classList.remove("t007-input-error")
        toggleHelper(input, false)
      }
    }

    function toggleHelper(input, bool) {
      const field = input.closest(".t007-input-field"),
      violation = window.t007FM.violationKeys.find(violation => input.validity[violation] || input.Validity?.[violation]) ?? "",
      helper = field.querySelector(`.t007-input-helper-text[data-violation="${violation}"]`),
      fallbackHelper = field.querySelector(`.t007-input-helper-text[data-violation="auto"]`) 
      input.closest(".t007-input-field").querySelectorAll(`.t007-input-helper-text:not([data-violation="${violation}"])`).forEach(helper => helper?.classList.remove("t007-input-show"))
      if (helper) {
        helper.classList.toggle("t007-input-show", bool)
      } else if (fallbackHelper) {
        fallbackHelper.textContent = input.validationMessage
        fallbackHelper.classList.toggle("t007-input-show", bool)
      }
    }

    function forceRevalidate(input) {
      input.checkValidity()
      input.dispatchEvent(new Event('input'))
    }

    function updatePasswordMeter(input) {
      const passwordMeter = input.closest(".t007-input-field").querySelector(".t007-input-password-meter")
      if (!passwordMeter) return
      const value = input.value?.trim()
      let strengthLevel = 0
      if (value.length < Number(input.minLength ?? 0)) strengthLevel = 1
      else {
      if (/[a-z]/.test(value)) strengthLevel ++
      if (/[A-Z]/.test(value)) strengthLevel ++
      if (/[0-9]/.test(value)) strengthLevel ++
      if (/[\W_]/.test(value)) strengthLevel ++
      }
      passwordMeter.dataset.strengthLevel = strengthLevel
    }

    function validateInput(input, notify = false) {
      if (form.dataset.globalError || !input?.classList.contains("t007-input")) return
      updatePasswordMeter(input)
      let value, errorBool
      switch(input.type) {
        case "file":
          input.Validity = input.Validity ?? {}
          if (!input.files) break
          let totalSize = 0,
          totalFiles = 0
          const setMaxError = (size, max, n) => {
            const maxSize = Number(max)
            errorBool = size > maxSize
            input.Validity.rangeOverflow = errorBool
            input.setCustomValidity(errorBool ? (n ? `File ${input.files.length > 1 ? n : ""} size of ${window.t007FM.convertFileSize(size)} exceeds the per file maximum of ${window.t007FM.convertFileSize(maxSize)}` : `Total files size of ${window.t007FM.convertFileSize(size)} exceeds the total maximum of ${formatSize(maxSize)}`) : "")
          }
          const setMinError = (size, min, n=0) => {
            const minSize = Number(min)
            errorBool = size < minSize
            input.Validity.rangeUnderflow = errorBool
            input.setCustomValidity(errorBool ? (n ? `File ${input.files.length > 1 ? n : ""} size of ${window.t007FM.convertFileSize(size)} is less than the per file minimum of ${formatSize(minSize)}` : `Total files size of ${window.t007FM.convertFileSize(size)} is less than the total minimum of ${formatSize(minSize)}`) : "")
          }    
          for (const file of input.files) {
            totalFiles ++
            totalSize += file.size
            if (input.accept) {
              const acceptedTypes = input.accept?.split(",").map(type => type.trim().replace(/\*/g, "")) ?? []
              errorBool = !acceptedTypes.some(type => file.type.includes(type))
              input.Validity.typeMismatch = errorBool
              input.setCustomValidity(errorBool ? `File  ${totalFiles>1?totalFiles:''} type of '${file.type}' is not among acceptable types: '${input.accept}'` : "")
              if (errorBool) break               
            }
            const max = input.maxSize ?? input.getAttribute("maxsize")
            if (max) {
              setMaxError(file.size, max, totalFiles)
              if (errorBool) break
            }
            const min = input.minSize ?? input.getAttribute("minsize")
            if (min) {
              setMinError(file.size, min, totalFiles)
              if (errorBool) break
            }
          }
          if (input.multiple) {
            const maxTotalSize = input.maxTotalSize ?? input.getAttribute("maxtotalsize")
            if (maxTotalSize) {
              setMaxError(totalSize, maxTotalSize)
              if (errorBool) break
            }
            const minTotalSize = input.minTotalSize ?? input.getAttribute("mintotalsize")
            if (minTotalSize) {
              setMinError(totalSize, minTotalSize)
              if (errorBool) break
            }
            const maxLength = input.maxLength ?? input.getAttribute("maxlength")
            if (maxLength) {
              const max = Number(maxLength)
              if (!max) break
              errorBool = totalFiles > max
              input.Validity.tooLong = errorBool
              input.setCustomValidity(errorBool ? `Selected ${totalFiles} files exceeds the maximum of ${max} allowed file${max>1?'s':''}` : "")
              if (errorBool) break
            }
            const minLength = input.minLength ?? input.getAttribute("minLength")
            if (minLength) {
              const min = Number(minLength)
              if (!min) break
              errorBool = totalFiles < min
              input.Validity.tooShort = errorBool
              input.setCustomValidity(errorBool ? `Selected ${totalFiles} files is less than the minimum of ${min} allowed file${min>1?'s':''}` : "")
              if (errorBool) break
            }
          }
          break
      }
      switch(input.custom ?? input.getAttribute("custom")) {
        case "password":
          value = input.value?.trim()
          if (value === "") break
          const confirmPasswordInput = Array.from(inputs).find(input => (input.custom ?? input.getAttribute("custom")) === "confirm-password")
          if (!confirmPasswordInput) break
          const confirmPasswordValue = confirmPasswordInput.value?.trim() 
          confirmPasswordInput.setCustomValidity(value !== confirmPasswordValue ? "Both passwords do not match" : "")
          toggleError(confirmPasswordInput, value !== confirmPasswordValue, notify)
          break
        case "confirm_password":
          value = input.value?.trim()
          if (value === "") break
          const passwordInput = Array.from(inputs).find(input => (input.custom ?? input.getAttribute("custom")) === "password")
          if (!passwordInput) break
          const passwordValue = passwordInput.value?.trim()
          errorBool = value !== passwordValue
          input.setCustomValidity(errorBool ? "Both passwords do not match" : "")
          break
        case "onward_date":
          if (input.min) break
          input.min = new Date().toISOString().split('T')[0]
          forceRevalidate(input)
          break    
      }
      errorBool = errorBool ?? !input.validity?.valid
      toggleError(input, errorBool, notify)
      if (errorBool) return
      if (input.type === "radio")
        Array.from(inputs)
        ?.filter(i => i.name == input.name)
        ?.forEach(radio => toggleError(radio, errorBool, notify))
    }

    function validateFormOnClient() {
      Array.from(inputs).forEach(input => validateInput(input, true, true))
      return Array.from(inputs).every(input => input.validity.valid)
    }

    function toggleFormGlobalError(bool) {
      form.dataset.globalError = bool
      form.querySelectorAll(".t007-input-field").forEach(field => {
        field.classList.toggle("t007-input-error", bool)
        if (bool) field.querySelector(".t007-input-floating-label")?.classList.add("t007-input-shake")
      })
    }
  }
}

if (typeof window !== "undefined") {
  window.t007FM = T007_Form_Manager
  window.t007FM.init()
}