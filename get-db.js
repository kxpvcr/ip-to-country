const ip2co = require('./index.js')

if (ip2co.dbCSVCheckExp(48)) {
    ip2co
        .dbGet()
        .then(() => {
            ip2co.dbLoad()
        }, (err) => {
            console.error(err)
        })
} else {
    ip2co.dbLoad()
}
