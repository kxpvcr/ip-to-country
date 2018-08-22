const fs = require('fs')
const path = require('path')
const request = require('request')
const zlib = require('zlib')

const DB_FILE_URL = 'http://software77.net/geo-ip/?DL=1'

const MODULE_PATH = fs.realpathSync(`${__dirname}`)
const DATA_PATH = `${MODULE_PATH}${path.sep}data`
const DB_CSV_FILE = `${DATA_PATH}${path.sep}IpToCountry.csv`

const calcIpAsNumber = (ts) => {
    return parseInt(ts[3], 10)
        + (parseInt(ts[2], 10) * 256)
        + (parseInt(ts[1], 10) * 256 * 256)
        + (parseInt(ts[0], 10) * 256 * 256 * 256)
}

const createBasicIpObject = (currentIp, ipParts) => {
    return {
        ip: currentIp,
        ipNum: calcIpAsNumber(ipParts),
        registery: null,
        assigned: null,
        coCode2: null,
        coCode3: null,
        country: null,
        time: null,
        found: false,
    }
}

/**
 * Checks whether the directory of the module can be written to,
 * in order to save the DB file.
 * @return {boolean}
 */
const checkModuleDirectoryIsWritable = () => {
    let flag = true

    try {
        fs.accessSync(DATA_PATH, fs.W_OK)
    } catch (error) {
        flag = false
    }

    return flag
}

module.exports = function() {
    const gzip = zlib.createGunzip()
    const dataSet = []

    /**
     * Check if the database CSV file exists
     * @return {boolean}
     */
    const checkIfDbFileExists = () => {
        return fs.existsSync(DB_CSV_FILE)
    }

    /**
     * Check if the database CSV file has expired: its last modification time is greater
     * than the maximum time difference specific in the `hour` argument.
     * @param  {number} maxHoursSinceModification
     * @return {boolean}
     */
    const checkIfCsvFileHasExpired = function checkIfCsvFileHasExpired(maxHoursSinceModification) {
        if (checkIfDbFileExists() === false) {
            return true
        }

        if (isNaN(Number(maxHoursSinceModification))) {
            throw new Error('Argument is not a number')
        }

        const ss = fs.statSync(DB_CSV_FILE)

        const modifiedTime = (ss && ss.mtime && ss.mtime.getTime) ? ss.mtime.getTime() : 0

        const currentTime = (new Date()).getTime()

        const hourDifference = modifiedTime ? Math.floor((currentTime - modifiedTime) / (60 * 60 * 1000)) : 0

        const expirationTime = parseInt(('' + maxHoursSinceModification), 10)

        return (expirationTime <= hourDifference)
    }

    const getDatabase = () => {
        return new Promise(function(resolve, reject) {
            request(DB_FILE_URL)
                .pipe(gzip)
                .pipe(fs.createWriteStream(DB_CSV_FILE))
                .on('finish', () => {
                    resolve('Done downloading and saving!')
                })
                .on('error', (error) => {
                    reject(error)
                })
        })
    }

    const loadDatabase = function loadDatabase(reload) {
        if (!checkIfDbFileExists()) {
            return false
        } else if (dataSet.length > 0 && reload !== true) {
            return true
        }

        // Read the file
        let fields = []

        const lines = fs.readFileSync(DB_CSV_FILE).toString().split('\n')

        for (const line of lines) {
            // Ignore commented-out lines
            if (line.indexOf('#') === 0) {
                continue
            }

            fields = []

            line.split(',').forEach((val, key) => {
                fields[key] = val.replace(/"/g, '')
            })

            if (fields.length !== 7) {
                continue
            }

            dataSet.push(fields)
        }

        return true
    }

    /**
     * Returns the country information of the given IP address(es).
     * @param  {string|string[]} ip
     * @return {?}
     */
    const getInfoForIp = function getInfoForIp (ip) {
        const result = {
            data: {},
            timeE: null,
            warnings: [],
        }

        const currentTime = new Date().getTime()

        let ipList = {}
        let ipListLen = 0

        if (!checkIfDbFileExists()) {
            throw new Error('Missing database file.')
        }

        if (!loadDatabase()) {
            throw new Error('Database is not loaded!')
        }

        if (!ip) {
            throw new Error('Missing IP address.')
        }

        ip = (typeof ip === 'string' ? [ip] : ip)

        if (!ip.length > 10) {
            throw new Error(`Too many IP addresses. (${ip.length}/10)`)
        }

        for (let currentIp of ip) {
            currentIp = ('' + currentIp).trim()

            if (!currentIp) {
                continue
            }

            var ipParts = currentIp.split('.')

            if (ipParts.length !== 4) {
                result.warnings.push(`Invalid IP address: ${currentIp}`)
                continue
            }

            ipList[currentIp] = createBasicIpObject(currentIp, ipParts)
            ipListLen++
        }

        let doneCntr = 0

        for (const dataSetLine of dataSet) {
            for (var key in ipList) {
                if (ipList[key].found === false
                    && ipList[key].ipNum >= dataSetLine[0]
                    && ipList[key].ipNum <= dataSetLine[1]) {

                    ipList[key].registery = dataSetLine[2]
                    ipList[key].assigned = dataSetLine[3]
                    ipList[key].time = new Date(dataSetLine[3] * 1000)
                    ipList[key].coCode2 = dataSetLine[4]
                    ipList[key].coCode3 = dataSetLine[5]
                    ipList[key].country = dataSetLine[6]
                    ipList[key].found = true
                    doneCntr++
                }
            }

            if (doneCntr === ipListLen) {
                break
            }
        }

        result.data  = ipList
        result.timeE = new Date().getTime() - currentTime

        return result
    }

    return {
        dataDirCheck: checkModuleDirectoryIsWritable,
        dbCSVCheck: checkIfDbFileExists,
        dbCSVCheckExp: checkIfCsvFileHasExpired,
        dbFileCheck: checkIfDbFileExists,
        dbGet: getDatabase,
        dbLoad: loadDatabase,
        ipSearch: getInfoForIp,
    }
}()
