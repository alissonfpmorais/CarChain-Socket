require('../../utils/array')()
const conn = require('./utils/conn')

function onConnect(child, options, remoteIp) {
    console.log('onConnect')

    child.emit(conn.keys.nodeList, conn.sendingNodes(child, options))

    child.on(conn.keys.nodeList, payload => {
        console.log('received nodes: ' + payload)
        conn.spreadTheWord(child, options, payload)
    })

    child.on(conn.keys.server.disconnect, () => {
        console.log('disconnecting...')
        conn.onDisconnectFromClient(child, options, remoteIp)
    })
}

function run(io, options) {
    io.on(conn.keys.server.connect, conn.onConnectToClient(io, options, onConnect))
}

module.exports = { run }