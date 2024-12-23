import Toast from "./T007_toast.js"

//just testing all possible positions
const positions = ["top-right", "top-left", "top-center", "bottom-right", "bottom-left", "bottom-center", "center-right", "center-left", "center-center"]

document.querySelector("button").addEventListener("click", () => {
    const toast = new Toast({
        text: "Hello, I'm Tobi007",
        position: positions[Math.floor(Math.random() * positions.length)],
    })
})