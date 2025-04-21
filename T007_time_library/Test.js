if (typeof window === "undefined") {
    require('./T007_getTime')
    console.log(global.getTime('now'))
} else {
    const timeDiv = document.querySelector(".time")
    setInterval(() => timeDiv.innerText = `${window.getTime('now')}`, 1000)
}


