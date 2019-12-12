export default class TreeJs {
    constructor () {
        this.install()
    }

    async install () {
        console.log('1', new Date().getTime())

        await this.timeOut()

        console.log('2', new Date().getTime())

    }

    timeOut (timeout = 2000) {
        return new Promise(resolve => {
            setTimeout(resolve, timeout)
        })
    }
}
