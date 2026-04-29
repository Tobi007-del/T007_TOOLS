import { initArrowNavigation, initFocusTrap, initOutsideClick, removeArrowNavigation, removeFocusTrap, removeOutsideClick } from "@t007/utils/hooks/vanilla";
import { bindAllMethods, createEl, isDef, loadResource, uid } from "@t007/utils";
import "../css/index.css";

class T007_Dialog {
  constructor(resolve, { id, closedBy: by, rootElement: root = document.body, scoped = true }) {
    bindAllMethods(this);
    this.resolve = resolve;
    t007.dialogs.set((this.id = id ?? uid("t007_dialog_")), this);
    (this.rootElement = root?.isConnected ? root : document.body), (this.rootScoped = this.rootElement !== document.body), (this.scoped = this.rootScoped && scoped);
    this.rootElement.append((this.dialog = createEl("dialog", { closedBy: by || (this.rootScoped ? "none" : "any"), className: `t007-dialog${this.rootScoped ? " t007-dialog-scoped" : ""}`, id: this.id })));
    this.dialog.addEventListener("cancel", this.cancel);
    initArrowNavigation(this.dialog, { enabled: true, rovingTab: false });
    this.rootScoped && !by && initOutsideClick(this.dialog, { enabled: true, onOutsideClick: this.cancel, root: this.rootElement, scoped: this.scoped });
  }
  show() {
    this.dialog[this.rootScoped ? "show" : "showModal"]();
    initFocusTrap(this.dialog, { enabled: true, root: this.rootElement, scoped: this.scoped });
  }
  remove() {
    removeArrowNavigation(this.dialog), removeFocusTrap(this.dialog), removeOutsideClick(this.dialog);
    this.dialog.open && this.dialog.close(), this.dialog.remove(), t007.dialogs.delete(this.id);
  }
  confirm(res = true) {
    this.remove(), this.resolve(res instanceof Event ? true : res);
  }
  cancel(res = false) {
    this.remove(), this.resolve(res instanceof Event ? false : res);
  }
}

class T007_Alert_Dialog extends T007_Dialog {
  constructor({ message, resolve, options = {} }) {
    super(resolve, options), this.render(message, options);
  }
  render(message, options) {
    this.dialog.innerHTML = `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${message}</p>
      </div>
      <div class="t007-dialog-bottom-section">
        <button type="button" data-autofocus data-arrow-item class="t007-dialog-confirm-button">${options.confirmText || "OK"}</button>
      </div>
    `;
    this.dialog.querySelector(".t007-dialog-confirm-button").addEventListener("click", this.confirm);
    this.show();
  }
}

class T007_Confirm_Dialog extends T007_Dialog {
  constructor({ question, resolve, options = {} }) {
    super(resolve, options), this.render(question, options);
  }
  render(question, options) {
    this.dialog.innerHTML = `
      <div class="t007-dialog-top-section">
        <p class="t007-dialog-question">${question}</p>
      </div>
      <div class="t007-dialog-bottom-section">
        <button type="button" data-autofocus data-arrow-item class="t007-dialog-confirm-button">${options.confirmText || "OK"}</button>
        <button type="button" data-arrow-item class="t007-dialog-cancel-button">${options.cancelText || "Cancel"}</button>
      </div>
    `;
    this.dialog.querySelector(".t007-dialog-confirm-button").addEventListener("click", this.confirm);
    this.dialog.querySelector(".t007-dialog-cancel-button").addEventListener("click", this.cancel);
    this.show();
  }
}

class T007_Prompt_Dialog extends T007_Dialog {
  constructor({ question, defaultValue, resolve, options = {} }) {
    super(resolve, options), this.render(question, defaultValue, options);
  }
  async render(question, defaultValue, options) {
    options = { ...options, value: defaultValue };
    await loadResource(window.T007_INPUT_JS_SRC, "script");
    this.dialog.innerHTML = `
      <form class="t007-input-form" novalidate>
        <div class="t007-dialog-top-section">
          <p class="t007-dialog-question">${question}</p>
        </div>
        <div class="t007-dialog-bottom-section">
          <button type="submit" data-arrow-item class="t007-dialog-confirm-button">${options.confirmText || "OK"}</button>
          <button type="button" data-arrow-item class="t007-dialog-cancel-button">${options.cancelText || "Cancel"}</button>
        </div>
      </form>
    `;
    (this.form = this.dialog.querySelector("form")).lastElementChild.insertAdjacentElement("beforebegin", t007.field?.(options) || createEl("input", options));
    this.form.onSubmit = this.confirm; // t007.handleFormValidation will call form.onSubmit if validation is successful
    this.dialog.querySelector(".t007-dialog-cancel-button").addEventListener("click", this.cancel);
    t007.handleFormValidation?.(this.form);
    this.show();
  }
  show() {
    super.show(), this.form?.elements?.[0]?.select?.();
  }
  confirm() {
    super.confirm(this.form.elements[0]?.value);
  }
  cancel() {
    super.cancel(null);
  }
}

export function alert(message, options) {
  return new Promise((resolve) => new T007_Alert_Dialog({ resolve, message, options }));
}

export function confirm(question, options) {
  return new Promise((resolve) => new T007_Confirm_Dialog({ resolve, question, options }));
}

export function prompt(question, defaultValue, options) {
  return new Promise((resolve) => new T007_Prompt_Dialog({ resolve, question, defaultValue, options }));
}

export function dismiss(id, response) {
  if (isDef(id)) return t007.dialogs.get(id)?.cancel(response);
  for (const dialog of t007.dialogs.values()) dialog.cancel(response);
}

if ("undefined" !== typeof window) {
  t007.alert = alert;
  t007.confirm = confirm;
  t007.prompt = prompt;
  t007.dismiss = dismiss;
  t007.dialogs = new Map();
  loadResource(T007_DIALOG_CSS_SRC), loadResource(window.T007_INPUT_JS_SRC, "script");
  window.Alert ??= t007.alert;
  window.Confirm ??= t007.confirm;
  window.Prompt ??= t007.prompt;
  window.Dismiss ??= t007.dismiss;
  console.log("%cT007 Dialogs attached to window!", "color: darkturquoise");
}
