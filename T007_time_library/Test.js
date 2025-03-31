if (typeof window === "undefined") {
    var getTime = require('./T007_getTime')
    getTime = global.getTime
    console.log(getTime('now'))
} else {
    const timeDiv = document.querySelector(".time")
    document.addEventListener("DOMContentLoaded", () => setInterval(() => timeDiv.innerText = `${getTime('now')}`, 1000))    
}


