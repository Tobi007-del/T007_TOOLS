import "./css/index.css";
import { isDef, bindAllMethods, createEl, loadResource } from "@t007/utils";

class T007_Dialog {
  dialog;
  confirmBtn;
  cancelBtn;
  constructor(resolve) {
    bindAllMethods(this);
    this.resolve = resolve;
    document.body.append(
      (this.dialog = createEl("dialog", {
        className: "t007-dialog",
        closedBy: "any",
      }))
    );
    this.dialog.addEventListener("cancel", this.cancel);
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
        <button class="t007-dialog-confirm-button" type="button">${options.confirmText || "OK"}</button>
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
        <button class="t007-dialog-confirm-button" type="button">${options.confirmText || "OK"}</button>
        <button class="t007-dialog-cancel-button" type="button">${options.cancelText || "Cancel"}</button>
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
    await loadResource(window.T007_INPUT_JS_SRC, "script");
    options.value = defaultValue;
    this.dialog.innerHTML = `
      <form class="t007-input-form" novalidate>
        <div class="t007-dialog-top-section">
          <p class="t007-dialog-question">${question}</p>
        </div>
        <div class="t007-dialog-bottom-section">
          <button class="t007-dialog-confirm-button" type="submit">${options.confirmText || "OK"}</button>
          <button class="t007-dialog-cancel-button" type="button">${options.cancelText || "Cancel"}</button>
        </div>
      </form>
    `;
    (this.form = this.dialog.querySelector("form")).lastElementChild.insertAdjacentElement("beforebegin", t007.FM?.field(options) || createEl("input", options));
    this.form.onSubmit = this.confirm;
    this.confirmBtn = this.dialog.querySelector(".t007-dialog-confirm-button");
    this.cancelBtn = this.dialog.querySelector(".t007-dialog-cancel-button");
    this.cancelBtn.addEventListener("click", this.cancel);
    t007.FM?.handleFormValidation?.(this.form);
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

export function alert(message, options) {
  return new Promise((resolve) => new T007_Alert_Dialog({ message, resolve, options }));
}

export function confirm(question, options) {
  return new Promise((resolve) => new T007_Confirm_Dialog({ question, resolve, options }));
}

export function prompt(question, defaultValue, options) {
  return new Promise((resolve) => new T007_Prompt_Dialog({ question, defaultValue, resolve, options }));
}

if (isDef(window)) {
  t007.alert = alert;
  t007.confirm = confirm;
  t007.prompt = prompt;
  loadResource(T007_DIALOG_CSS_SRC), loadResource(window.T007_INPUT_JS_SRC, "script");
  window.Alert ??= t007.alert;
  window.Confirm ??= t007.confirm;
  window.Prompt ??= t007.prompt;
  console.log("%cT007 Dialogs attached to window!", "color: darkturquoise");
}
