require('../../utils/array')()
const conn = require('./utils/conn')

function run(io, options, remoteIp) {
    io.on(conn.keys.client.connect, conn.onConnectToServer(io, options, remoteIp))

    io.on(conn.keys.nodeList, payload => {
        console.log('received nodes: ' + payload)
        conn.spreadTheWord(options, payload)
    })

    io.on(conn.keys.client.reconnect, () => {
        console.log('reconnecting...')
        conn.sendingNodes(io, options)
    })

    io.on(conn.keys.client.disconnect, () => {
        console.log('disconnecting...')
        conn.disconnectFromServer(io, options, remoteIp)
    })
}

module.exports = { run }