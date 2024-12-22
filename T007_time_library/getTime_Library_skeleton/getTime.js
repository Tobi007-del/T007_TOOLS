// function Person(firstname,lastname) {

//     this.firstname = firstname

//     this.lastname = lastname

//     this.hello = function() {

//         return 'Hello, ' +

//         this.firstname + ' ' +

//         this.lastname + '.'

//     }



//     console.log('inside the function:', this)

// }



// var john = new Person('john','smith')



// console.log("outside the function: ", john)



// console.log(john.firstname)

// console.log(john.lastname)

// console.log(john.hello())









// function getTime() {

//     const date = new Date()



//     this. now = function() {

//         return date

//     }

// }



// var time = new getTime()

// console.log(time.now())









// function getTime() {

//     const date = new Date()



//     this.now = function() {

//     //We can convert the built in getHours() method to conform to a 12 hour clock by taking the current time and finding it's remainder when divided by 12 with the modulo operator

//     //Example: if it is 13:00 on a 24 hour clock, and 13%12 leaves a remainder of 1, then that means it is 1 o'clock

//         let hours = date.getHours() % 12

//     //If the current hour is less than or equal to 12, return AM, otherwise return PM

//         let ampm = date.getHours() <= 12 ? 'AM' : 'PM'

//     //Simple alias method for the built in getMinutes() method 

//         let minutes = date.getMinutes()

//     //On a 24 hour clock, if it is midnight, it is 24:00, 24 % 12 is 0, which we don't want.

//     //So we can use a ternary operator to check if it is midnight, and if it is, return 12

//         hours = hours ? hours : 12

//     //Simple formatting that adda a zero before any minute of an hour that is less than 10.

//         minutes = minutes < 10 ? '0' + minutes : minutes

//     //Everything we ust wrote rolled into one nice simple string

//         let time = hours + ':' + minutes + ' ' + ampm

    

//         return time

//     }



//     this.day = function() {

//         let day = date.getDate() 



//         return day

//     }



//     this.month = function() {

//         let month = date.getMonth()

//     //We need to add 1 to the month number because in Javascript, month numbers start at Zero, not 1; just like the indices of an array

//         return (month + 1)

//     }



//     this.year = function() {

//         let currentYear = date.getFullYear()

//         return currentYear

//     }



//     this.formattedDate = function() {

//         let time = this.now()

//         let day = this.day()

//         let month = this.month()

//         let year = this.year()

        

//         const formattedDate = '(' + time + ')' + ' ' + month + '/' + day + '/' + year



//         return formattedDate

//     }

// }



// var time = new getTime()



// console.log(time.formattedDate())









// (function getTime(env) {

//     date = new Date()



//     this.now = function() {

//         let hours = date.getHours() % 12



//         let ampm = date.getHours() <= 12 ? 'AM' : 'PM'



//         let minutes = date.getMinutes()



//         hours = hours ? hours: 12



//         minutes = minutes < 10 ? '0' + minutes : minutes 



//         return hours + ':' + minutes + ' ' + ampm

//     }



//     this.day = function() {

//         return date.getDate()

//     }



//     this.month = function() {

//         return (date.getMonth() + 1)

//     }



//     this.year = function() {

//         return date.getFullYear()

//     }



//     this.fullDate = function() {

//         return '(' + this.now() + ')' + ' ' + this.month() + '/' + this.day() + '/' + this.year()

//     }



//     console.log(env)

// })(typeof window === "undefined" ? global : window)



// var getTime = new getTime()



// console.log(getTime.now())



// console.log(getTime.day())



// console.log(getTime.month())



// console.log(getTime.year())



// console.log(getTime.fullDate())











// (function(env) {

//     var getTime = function() {

//         return new getTime()

//     }



//     env.getTime = getTime



//     console.log(env)

// })(typeof window === "undefined" ? global : window)









// (function(env) {

//     var getTime = function() {

//         return new getTime.init()

//     }



//     getTime.init = function(){

//         this.test = 'test string'

//     }



//     env.getTime = getTime



// })(typeof window === "undefined" ? global : window)



// console.log(getTime())









// (function(env) {

//     var getTime = function(){

//         return new getTime.init()

//     }



//     getTime.init = function(){



//         this.date = new Date()



//         this.now = function() {

//             let hours = this.date.getHours() % 12



//             let ampm = this.date.getHours() <= 12 ? 'AM' : 'PM'



//             let minutes = this.date.getMinutes()

            

//             hours = hours ? hours : 12



//             minutes = minutes < 10 ? '0' + minutes : minutes



//             return hours + ':' + minutes + ' ' + ampm

//         }



//         this.day = function() {

//             return this.date.getDate()

//         }



//         this.month = function() {

//             return (this.date.getMonth() + 1)

//         }



//         this.year = function() {

//             return this.date.getFullYear()

//         }



//         this.fullDate = function() {

//             return '(' + this.now() + ')' + ' ' + this.month() + '/' + this.day() + '/' + this.year()

//         }

//     }



//     env.getTime = getTime

    

// })(typeof window === "undefined" ? global : window)



// // console.log(getTime().now())

// // console.log(getTime().day())

// // console.log(getTime().month())

// // console.log(getTime().year())

// // console.log(getTime().fullDate())



// getTime.prototype = {

//     test: function() {

//         return 'test string'

//     }

// }



// getTime.init.prototype = getTime.prototype











// (function(env) {

//     var getTime = function(){

//         return new getTime.init()

//     }



//     getTime.init = function(){



//         this.date = new Date()



//     }



//     getTime.prototype = {

//         now : function() {

//             let hours = this.date.getHours() % 12



//             let ampm = this.date.getHours() <= 12 ? 'AM' : 'PM'



//             let minutes = this.date.getMinutes()

            

//             hours = hours ? hours : 12



//             minutes = minutes < 10 ? '0' + minutes : minutes



//             return hours + ':' + minutes + ' ' + ampm

//         },



//         day : function() {

//             return this.date.getDate()

//         },



//         month : function() {

//             return (this.date.getMonth() + 1)

//         },



//         year : function() {

//             return this.date.getFullYear()

//         },



//         fullDate : function() {

//             return '(' + this.now() + ')' + ' ' + this.month() + '/' + this.day() + '/' + this.year()

//         }

//     }



//     getTime.init.prototype = getTime.prototype



//     env.getTime = getTime

    

// })(typeof window === "undefined" ? global : window)











// (function(env) {

//     var getTime = function(keyword){

//         var init = new getTime.init(keyword)

//         return init[keyword]

//     }



//     getTime.init = function(keyword){



//         this.date = new Date()

//         this[keyword] = this[keyword] ? this[keyword]() : 'Error. Please pass an argument into getTime()'

//     }



//     getTime.prototype = {

//         now : function() {

//             let hours = this.date.getHours() % 12



//             let ampm = this.date.getHours() <= 12 ? 'AM' : 'PM'



//             let minutes = this.date.getMinutes()

            

//             hours = hours ? hours : 12



//             minutes = minutes < 10 ? '0' + minutes : minutes



//             return hours + ':' + minutes + ' ' + ampm

//         },



//         day : function() {

//             return this.date.getDate()

//         },



//         month : function() {

//             return (this.date.getMonth() + 1)

//         },



//         year : function() {

//             return this.date.getFullYear()

//         },



//         fullDate : function() {

//             return '(' + this.now() + ')' + ' ' + this.month() + '/' + this.day() + '/' + this.year()

//         }

//     }



//     getTime.init.prototype = getTime.prototype



//     env.getTime = getTime

    

// })(typeof window === "undefined" ? global : window)











// (function(env) {

//     var getTime = function(keyword){

//         var init = new getTime.init(keyword)

//         return init[keyword]

//     }



//     getTime.init = function(keyword){



//         this.date = new Date()

//         this[keyword] = this[keyword] ? this[keyword]() : this.error(keyword)

//     }



//     getTime.prototype = {

//         now : function() {

//             let hours = this.date.getHours() % 12



//             let ampm = this.date.getHours() <= 12 ? 'AM' : 'PM'



//             let minutes = this.date.getMinutes()

            

//             hours = hours ? hours : 12



//             minutes = minutes < 10 ? '0' + minutes : minutes



//             return hours + ':' + minutes + ' ' + ampm

//         },



//         day : function() {

//             return this.date.getDate()

//         },



//         month : function() {

//             return (this.date.getMonth() + 1)

//         },



//         year : function() {

//             return this.date.getFullYear()

//         },



//         fullDate : function() {

//             return '(' + this.now() + ')' + ' ' + this.month() + '/' + this.day() + '/' + this.year()

//         },



//         error: function(keyword) {

//             if(keyword === '' || keyword === null || keyword === undefined) 

//                 return 'Please enter a keyword'

//             else 

//                 return `${keyword} is an invalid keyword`

//         }

//     }



//     getTime.init.prototype = getTime.prototype



//     env.getTime = getTime

    

// })(typeof window === "undefined" ? global : window)



// (function(env) {

//     var getTime = function(keyword){

//         var init = new getTime.init(keyword)

//         return init[keyword]

//     }



//     getTime.init = function(keyword){



//         this.date = new Date()

//         this[keyword] = this[keyword] ? this[keyword]() : this.error(keyword)

//     }



//     getTime.prototype = {

//         now : function() {

//             let hours = this.date.getHours() % 12



//             let ampm = this.date.getHours() <= 12 ? 'AM' : 'PM'



//             let minutes = this.date.getMinutes()



//             let seconds = this.date.getSeconds()

            

//             hours = hours ? hours : 12



//             minutes = minutes < 10 ? '0' + minutes : minutes



//             seconds = seconds < 10 ? '0' + seconds : seconds

 

//             return hours + ':' + minutes + ':' + seconds + ' ' + ampm

//         },



//         day : function() {

//             return this.date.getDate()

//         },



//         month : function() {

//             return (this.date.getMonth() + 1)

//         },



//         year : function() {

//             return this.date.getFullYear()

//         },



//         fullDate : function() {

//             return '(' + this.now() + ') ' + this.month() + '/' + this.day() + '/' + this.year()

//         },



//         error: function(keyword) {

//             if(keyword === '' || keyword === null || keyword === undefined) 

//                 return 'Please enter a keyword'

//             else 

//                 return `${keyword} is an invalid keyword`

//         }

//     }



//     getTime.init.prototype = getTime.prototype



//     env.getTime = getTime

    

//     // module.exports = getTime

// })(typeof window === "undefined" ? global : window)

// 









(function(env) {

    var init = function(keyword){

        return new getTime(keyword)[keyword]

    }



    class getTime {

        constructor(keyword) {

            this.date = new Date()

            this[keyword] = this[keyword] ? this[keyword]() : this.error(keyword)

        }



        now() {

            let hours = this.date.getHours() % 12



            let ampm = this.date.getHours() <= 12 ? 'AM' : 'PM'



            let minutes = this.date.getMinutes()



            let seconds = this.date.getSeconds()

            

            hours = hours ? hours : 12



            minutes = minutes < 10 ? '0' + minutes : minutes



            seconds = seconds < 10 ? '0' + seconds : seconds

 

            return hours + ':' + minutes + ':' + seconds + ' ' + ampm

        }



        day() {

            return this.date.getDate()

        }



        month() {

            return (this.date.getMonth() + 1)

        }



        year() {

            return this.date.getFullYear()

        }



        fullDate() {

            return '(' + this.now() + ') ' + this.month() + '/' + this.day() + '/' + this.year()

        }



        error(keyword) {

            if(keyword === '' || keyword === null || keyword === undefined) 

                return 'Please enter a keyword'

            else 

                return `${keyword} is an invalid keyword`

        }

    }



    env.getTime = init

    

    // module.exports = init

})(typeof window === "undefined" ? global : window)