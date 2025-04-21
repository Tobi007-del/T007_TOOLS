import { Alert, Confirm } from "./T007_dialog.js"

window.showAlert = async function showAlert() {
    await Alert("Hello, I'm Tobi007")
}

window.showConfirm = async function showConfirm() {
    const boolean = await Confirm("You are about to know my identity, I'm Tobi007")
}