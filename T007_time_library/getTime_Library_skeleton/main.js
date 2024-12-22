// var getTime = new getTime()



// console.log(getTime.fullDate())



// var getTime = require('./getTime')



// console.log(getTime)









// (function Person(firstname,lastname) {

//     this.firstname = firstname

//     this.lastname = lastname



//     console.log(this.firstname,this.lastname)

// })('John','Smith')









// (function (window) {

//     console.log(window)

// })(window)



// (function (global) {

//     console.log(global)

// })(global)









// (function Person(environment) {

//     console.log(environment)

// })(typeof window === "undefined" ? global : window)









// var getTime = require('./getTime')



// console.log(global.getTime())









// var getTime = require('./getTime')

// getTime = global.getTime



// console.log(getTime())











// if (typeof window === "undefined") {

//     var getTime = require('./getTime')

//     getTime = global.getTime

// }



// console.log(getTime())









// if (typeof window === "undefined") {

//     var getTime = require('./getTime')

//     getTime = global.getTime

// } else {

//     document.addEventListener("DOMContentLoaded", addTime)

//     function addTime() {

//         const timeDiv = document.querySelector(".time")

//         timeDiv.innerText = `${getTime().now()}`

//     }

// }



// console.log(`%c${getTime().now()}`,'color:green; font-size:xx-large;')

// console.log(getTime().test())











if (typeof window === "undefined") {

    var getTime = require('./getTime')

    getTime = global.getTime

} else {

    document.addEventListener("DOMContentLoaded", addTime)

    function addTime() {

        const timeDiv = document.querySelector(".time")

        timeDiv.innerText = `${getTime('now')}`

    }

}



console.log(getTime('now'))

console.log(getTime('day'))

console.log(getTime('month'))

console.log(getTime('year'))

console.log(getTime('fullDate'))

console.log(getTime(''))

console.log(getTime('datee'))





