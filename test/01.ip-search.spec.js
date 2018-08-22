const ip2co = require('../')
const expect = require('chai').expect

describe('ipSearch', () => {
    const ipSearch = ip2co.ipSearch(['74.125.225.71', '98.138.253.109'])

    it('should correctly identify the test IP addresses', (done) => {
        expect(ipSearch).to.be.a('object')

        expect(ipSearch).to.have.property('data')
        expect(ipSearch.data).to.be.a('object')

        expect(ipSearch.data).to.have.property('74.125.225.71')
        expect(ipSearch.data).to.have.property('98.138.253.109')

        let ip1 = ipSearch.data['74.125.225.71']

        expect(ip1).to.have.property('ip')
        expect(ip1).to.have.property('ipNum')
        expect(ip1).to.have.property('registery')
        expect(ip1).to.have.property('assigned')
        expect(ip1).to.have.property('coCode2')
        expect(ip1).to.have.property('coCode3')
        expect(ip1).to.have.property('country')
        expect(ip1).to.have.property('time')
        expect(ip1).to.have.property('found', true)

        let ip2 = ipSearch.data['98.138.253.109']

        expect(ip2).to.have.property('ip')
        expect(ip2).to.have.property('ipNum')
        expect(ip2).to.have.property('registery')
        expect(ip2).to.have.property('assigned')
        expect(ip2).to.have.property('coCode2')
        expect(ip2).to.have.property('coCode3')
        expect(ip2).to.have.property('country')
        expect(ip2).to.have.property('time')
        expect(ip2).to.have.property('found', true)

        done()
    })
})
