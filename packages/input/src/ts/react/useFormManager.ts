import React, { useCallback } from "react";
import type { t007InputElement } from "./types";
import { fireInput } from "./utils/fn";
import { parentBeacon } from "./utils/consts";

/**
 * FormManager hook to validate form-level inputs, does not force a form setup though.
 * @param onSubmit Optional callback invoked after successful validation on submit.
 * @param formRef Optional form ref; when omitted, the form passed to handlers is used.
 * @returns handleSubmit: submit handler to attach to form elements, validate: function to trigger validation manually, fireInput: utility to trigger input events on fields.
 */
export function useFormManager(onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void, formRef?: React.RefObject<HTMLElement>) {
  /** validate can be used on any element so as not to force a form setup */
  const validate = useCallback(
    (formEl?: HTMLElement) => {
      const form = formRef?.current || formEl;
      if (!form) return false;
      let hasErrors = false;
      form.querySelectorAll<t007InputElement>(".t007-input").forEach((i) => (hasErrors = hasErrors || !i.checkValidity()));
      form.setAttribute(parentBeacon, `${hasErrors}`);
      form.querySelectorAll<t007InputElement>(".t007-input").forEach(fireInput);
      form.querySelector<t007InputElement>(`input:is(:invalid,[data-error])`)?.focus();
      form.addEventListener("focusin", () => form.setAttribute(parentBeacon, "false"));
      return !hasErrors;
    },
    [formRef]
  );

  /**  handleSubmit is just an event handler to reduce the boiler plate involved in manual validation. */
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      const form = formRef?.current || (e.currentTarget as HTMLFormElement);
      if (!form) return;
      e?.preventDefault();
      if (!validate(form)) return;
      if (onSubmit) onSubmit(e);
      else if (form instanceof HTMLFormElement) form.submit();
    },
    [formRef, validate, onSubmit]
  );

  return { handleSubmit, validate, fireInput };
}
