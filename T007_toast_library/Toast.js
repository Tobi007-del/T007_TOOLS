import Toast from "./T007_toast.js"

const positions = ["top-right", "top-left", "top-center", "bottom-right", "bottom-left", "bottom-center", "center-right", "center-left", "center-center"]

document.querySelector("button").addEventListener("click", () => {
    const toast = new Toast({
        text: "Hello",
        position: positions[Math.floor(Math.random() * positions.length)],
        position: "top-right"
    })
})