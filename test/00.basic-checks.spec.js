const ip2co = require('../')
const expect = require('chai').expect

describe('basic checks', function() {
    it('should confirm the directory of the module is writable', (done) => {
        expect(ip2co.dataDirCheck()).to.be.true
        done()
    })

    it('should confirm the database file is present', (done) => {
        expect(ip2co.dbFileCheck()).to.be.true
        done()
    })

    it('should have a recent database file (less than 48 hours)', (done) => {
        expect(ip2co.dbCSVCheckExp(48)).to.be.false
        done()
    })

    it('should be able to load the database', (done) => {
        expect(ip2co.dbLoad()).to.be.true
        done()
    })
})
