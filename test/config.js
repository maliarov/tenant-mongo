module.exports = {
    uri: 'mongodb://localhost:27017/tenantmongo?safe=true&slaveOk=true&journal=true',
    options: {
        native_parser: false,
        reaper: true,
        strict: false
    }
}