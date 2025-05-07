import { Alert, Confirm } from "./T007_dialog.js"

window.showAlert = async function() {
    await Alert("Hello, I'm Tobi007")
}

window.showConfirm = async function() {
    const boolean = await Confirm("You are about to know my identity, I'm Tobi007")
}

window.showPrompt = async function() {
    await Prompt("Do you know who I am now?", "Yes")
}