(function(env) {
    let init = function(keyword){
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


console.log(getTime("now"))