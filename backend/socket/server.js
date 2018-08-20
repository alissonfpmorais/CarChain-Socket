require('../../utils/array')()
const conn = require('./utils/conn')

function run(io, options) {
    io.on(conn.keys.server.connect, conn.onConnectToClient(io, options, onConnect))
}

function onConnect(child, options, remoteIp) {
    child.emit(conn.keys.nodeList, sendingNodes(options))

    child.on(conn.keys.nodeList, payload => {
        console.log('received nodes: ' + payload)
        conn.spreadTheWord(options, payload)
    })

    child.on(conn.keys.server.disconnect, () => {
        console.log('disconnecting...')
        conn.onDisconnectFromClient(child, options, remoteIp)
    })
}

module.exports = { run }