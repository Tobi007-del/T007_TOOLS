if (window) window.t007 ??= {};

export function Alert(message, options) {
  return new Promise(
    (resolve) => new T007_Alert_Dialog({ message, resolve, options })
  );
}

export function Confirm(question, options) {
  return new Promise(
    (resolve) => new T007_Confirm_Dialog({ question, resolve, options })
  );
}

export function Prompt(question, defaultValue, options) {
  return new Promise(
    (resolve) =>
      new T007_Prompt_Dialog({ question, defaultValue, resolve, options })
  );
}

if (typeof window !== "undefined") {
  window.Alert ??= t007.alert = Alert;
  window.Confirm ??= t007.confirm = Confirm;
  window.Prompt ??= t007.prompt = Prompt;
  window.T007_DIALOG_CSS_SRC ??= `/T007_TOOLS/T007_dialog_library/T007_dialog.css`;
  console.log("%cT007 Dialogs attached to window!", "color: green");
}

const _RESOURCE_CACHE = {};
function loadResource(src, type = "style", options = {}) {
  const {
    module = false,
    media = null,
    crossorigin = null,
    integrity = null,
  } = options;
  if (_RESOURCE_CACHE[src]) return _RESOURCE_CACHE[src];
  if (
    type === "script"
      ? [...document.scripts].some((s) => s.src?.includes(src))
      : type === "style"
      ? [...document.styleSheets].some((s) => s.href?.includes(src))
      : false
  )
    return Promise.resolve(null);
  _RESOURCE_CACHE[src] = new Promise((resolve, reject) => {
    if (type === "script") {
      const script = document.createElement("script");
      script.src = src;
      if (module) script.type = "module";
      if (crossorigin) script.crossOrigin = crossorigin;
      if (integrity) script.integrity = integrity;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Script load error: ${src}`));
      document.body.append(script);
    } else if (type === "style") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = src;
      if (media) link.media = media;
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Stylesheet load error: ${src}`));
      document.head.append(link);
    } else {
      reject(new Error(`Unsupported type: ${type}`));
    }
  });
  return _RESOURCE_CACHE[src];
}
loadResource(T007_DIALOG_CSS_SRC);

class T007_Dialog {
  dialog;
  confirmBtn;
  cancelBtn;
  constructor(resolve) {
    this.bindMethods();
    this.resolve = resolve;
    this.dialog = document.createElement("dialog");
    this.dialog.closedBy = "any";
    this.dialog.classList.add("t007-dialog");
    document.body.append(this.dialog);
    this.dialog.addEventListener("cancel", this.cancel);
  }

  bindMethods() {
    let proto = Object.getPrototypeOf(this);
    while (proto && proto !== Object.prototype) {
      for (const method of Object.getOwnPropertyNames(proto)) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, method);
        if (
          method !== "constructor" &&
          descriptor &&
          typeof descriptor.value === "function"
        )
          this[method] = this[method].bind(this);
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  show() {
    this.dialog.showModal();
    this.confirmBtn.focus();
  }

  remove() {
    this.dialog.close();
    this.dialog.remove();
  }

  confirm() {
    this.remove();
    this.resolve(true);
  }

  cancel() {
    this.remove();
    this.resolve(false);
  }
}

class T007_Alert_Dialog extends T007_Dialog {
  constructor({ message, resolve, options }) {
    super(resolve);
    this.render(message, options);
  }

  render(message, options = {}) {
    this.dialog.innerHTML = `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${message}</p>
      </div>
      <div class="t007-dialog-bottom-section">
        <button class="t007-dialog-confirm-button" type="button">${
          options.confirmText || "OK"
        }</button>
      </div>
    `;
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button");
    this.confirmBtn.addEventListener("click", this.confirm);
    this.show();
  }
}

class T007_Confirm_Dialog extends T007_Dialog {
  constructor({ question, resolve, options }) {
    super(resolve);
    this.render(question, options);
  }

  render(question, options = {}) {
    this.dialog.innerHTML = `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${question}</p>
      </div>
      <div class="t007-dialog-bottom-section">
        <button class="t007-dialog-confirm-button" type="button">${
          options.confirmText || "OK"
        }</button>
        <button class="t007-dialog-cancel-button" type="button">${
          options.cancelText || "Cancel"
        }</button>
      </div>
    `;
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button");
    this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button");
    this.confirmBtn.addEventListener("click", this.confirm);
    this.cancelBtn.addEventListener("click", this.cancel);
    this.show();
  }
}

class T007_Prompt_Dialog extends T007_Dialog {
  constructor({ question, defaultValue, resolve, options }) {
    super(resolve);
    this.render(question, defaultValue, options);
  }

  async render(question, defaultValue, options = {}) {
    await loadResource(
      window.T007_INPUT_JS_SRC ||
        `/T007_TOOLS/T007_input_library/T007_input.js`,
      "script"
    );
    options.value = defaultValue;
    this.dialog.innerHTML = `
      <form class="t007-input-form" novalidate>
        <div class="t007-dialog-top-section">
          <p class="t007-dialog-question">${question}</p>
        </div>
          ${createField?.(options)?.outerHTML}
        <div class="t007-dialog-bottom-section">
          <button class="t007-dialog-confirm-button" type="submit">${
            options.confirmText || "OK"
          }</button>
          <button class="t007-dialog-cancel-button" type="button">${
            options.cancelText || "Cancel"
          }</button>
        </div>
      </form>
    `;
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button");
    this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button");
    this.cancelBtn.addEventListener("click", this.cancel);
    this.form = this.dialog.querySelector("form");
    this.form.onSubmit = this.confirm;
    window.handleFormValidation(this.form);
    this.show();
  }

  show() {
    this.dialog.showModal();
    this.form.elements[0]?.focus();
    this.form.elements[0]?.select?.();
  }

  confirm() {
    this.remove();
    this.resolve(this.form.elements[0]?.value);
  }

  cancel() {
    this.remove();
    this.resolve(null);
  }
}
