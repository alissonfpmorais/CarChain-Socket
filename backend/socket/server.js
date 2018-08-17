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
                    console.log('nodes to connect: ' + payload)

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

function sendingNodes(options) {
    console.log('sending nodes')
    const nodes = options.nodesAsClient.concat(options.nodesAsServer)
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

    if(nodesToConnect.length > 0) options.connectToPool(nodesToConnect)

    options.clients.forEach(client => client.emit('nodes-to-connect', nodesToConnect))
    options.server.emit('nodes-to-connect', nodesToConnect)
}

function emitError(io, payload) {
    console.log(payload)
    
    try { io.emit('error', payload) }
    catch(err) {
        console.log('Can\'t emit error to child')
        console.log('Error: ' + err)
    }

    setTimeout(() => io.disconnect(true), 3000)
}

module.exports = { run }