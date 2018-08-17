require('../../utils/array')()

function run(options) {
    const io = options.server
    if (options.selfCheck()) io.on('connection', onConnection(io, options))
}

function onConnection(io, options) {
    if(options.selfCheck()) {
        const nodes = options.nodesAsClient.concat(options.nodesAsServer)

        return function(child) {
            console.log('new node connected')

            const remoteIp = getRemoteIpAddress(child.conn.remoteAddress)
            if(nodes.notHas(remoteIp)) {
                console.log('remote ip: ' + remoteIp)
                options.nodesAsClient.push(remoteIp)
                nodes.push(remoteIp)

                child.emit('server-nodelist', sendingNodes(nodes))

                child.on('nodes-to-connect', payload => {
                    console.log('nodes to connect: ' + payload)

                    if(options.selfCheck()) spreadTheWord(options, payload)
                    else emitError('node previously connected, closing connection!')
                })

                child.on('disconnect', () => {
                    console.log('node disconnected')
                    console.log('remote ip: ' + remoteIp)

                    if(options.selfCheck()) {
                        options.nodesAsClient.remove(remoteIp)
                        nodes.remove(remoteIp)
                    }
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

function sendingNodes(nodes) {
    console.log('sending nodes')
    return nodes
}

function getRemoteIpAddress(remoteAddress) {
    return remoteAddress.replace('::ffff:', '')
}

function getNodesToConnect(nodes, payload) {
    const nodesToConnect = payload.diff(nodes)
    return nodesToConnect
}

function spreadTheWord(options, payload) {
    const nodes = options.nodesAsClient.concat(options.nodesAsServer)
    const nodesToConnect = getNodesToConnect(nodes, payload)

    if(nodesToConnect.length > 0) {
        options.connectToPool(nodesToConnect)
        options.clients.forEach(client => client.emit('nodes-to-connect', nodesToConnect))
        options.server.emit('nodes-to-connect', nodesToConnect)
    }
}

function emitError(child, payload) {
    console.log(msg)
    child.emit('error', msg)
    setTimeout(() => child.disconnect(true), 3000)
}

module.exports = { run }