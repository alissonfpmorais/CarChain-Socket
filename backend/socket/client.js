require('../../utils/array')()

function run(io, getOptions, remoteIp) {
    const options = getOptions()
    if(options.selfCheck()) io.on('connect', onConnect(io, getOptions, remoteIp))
}

function onConnect(io, getOptions, remoteIp) {
    var options = getOptions()
    
    if(options.selfCheck()) {
        if(options.clients.notHas(io) && options.nodesAsServer.notHas(remoteIp)) {
            options.clients.push(io)
            options.nodesAsServer.push(remoteIp)

            io.on('server-nodelist', payload => spreadTheWord(getOptions(), payload))
            io.on('nodes-to-connect', payload => spreadTheWord(getOptions(), payload))
        } 
        else emitError('node previously connected, closing connection!')
    } 
    else emitError(io, 'client internal error, closing connection!')

    io.on('disconnect', () => {
        options = getOptions()
        options.nodesAsServer.remove(remoteIp)
        options.clients.remove(io)
    })
}

function getNodesToConnect(nodes, payload) {
    const nodesToConnect = []

    if(nodes.length >= payload.length) nodesToConnect.concat(nodes.diff(payload))
    else nodesToConnect.concat(payload.diff(nodes))

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

function emitError(io, payload) {
    console.log(msg)
    io.emit('error', msg)
    setTimeout(() => io.disconnect(true), 3000)
}

module.exports = { run }