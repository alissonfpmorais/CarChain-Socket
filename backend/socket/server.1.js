require('../../utils/array')()

function run(options) {
    const io = options.server
    if (options.selfCheck()) io.on('connection', onConnection(io, options))
}

function onConnection(io, options) {
    if(options.selfCheck()) {
        return function(child) {
            console.log('new node connected')
            const remoteIp = getRemoteIpAddress(child.conn.remoteAddress)

            if(options.nodesAsClient.notHas(remoteIp) && options.nodesAsServer.notHas(remoteIp)) {
                console.log('remote ip: ' + remoteIp)
                options.nodesAsClient.push(remoteIp)

                child.emit('server-nodelist', sendingNodes(options))

                child.on('nodes-to-connect', payload => {
                    console.log('received nodes: ' + payload)

                    if(options.selfCheck()) spreadTheWord(options, payload)
                    else emitError('node previously connected, closing connection!')
                })

                child.on('disconnect', () => {
                    console.log('node disconnected')
                    console.log('remote ip: ' + remoteIp)

                    if(options.selfCheck()) options.nodesAsClient.remove(remoteIp)
                    else emitError('node previously connected, closing connection!')
                })
            }
            else emitError('node previously connected, closing connection!')
        }
    } else {
        return function(child) {
            emitError('server internal error, closing connection!')
        }
    }
}

function getRemoteIpAddress(remoteAddress) {
    return remoteAddress.replace('::ffff:', '')
}

module.exports = { run }