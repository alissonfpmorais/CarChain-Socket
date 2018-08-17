require('../../utils/array')()

function run(io, options, remoteIp) {
    io.on('connect', onConnect(io, options, remoteIp))

    io.on('server-nodelist', payload => {
        console.log('server nodelist: ' + payload)
        
        if(options.selfCheck()) spreadTheWord(options, payload)
        else emitError(io, 'client internal error, closing connection!')
    })

    io.on('nodes-to-connect', payload => {
        console.log('received nodes: ' + payload)

        if(options.selfCheck()) spreadTheWord(options, payload)
        else emitError(io, 'client internal error, closing connection!')
    })

    io.on('reconnect', () => {
        console.log('reconnecting...')
        io.emit('nodes-to-connect', sendingNodes(options))
    })

    io.on('disconnect', () => {
        console.log('disconnecting...')

        if(options.selfCheck()) {
            options.nodesAsServer.remove(remoteIp)
            options.clients.remove(io)
        }
        else emitError(io, 'client internal error, closing connection!')
    })
}

function onConnect(io, options, remoteIp) {
    return function() {
        console.log('establishing connection')
    
        if(options.selfCheck()) {
            if(options.clients.notHas(io) && options.nodesAsServer.notHas(remoteIp)) {
                console.log('node connected to: ' + remoteIp)

                options.clients.push(io)
                options.nodesAsServer.push(remoteIp)
            } 
            else emitError(io, 'node previously connected, closing connection!')
        } 
        else emitError(io, 'client internal error, closing connection!')
    }
}

function sendingNodes(options) {
    console.log('sending nodes')
    const nodes = options.nodesAsClient.concat(options.nodesAsServer)
    return nodes
}

function getNodesToConnect(nodes, payload) {
    const nodesToConnect = payload.diff(nodes)
    return nodesToConnect
}

function spreadTheWord(options, payload) {
    console.log('spread the word')

    const nodes = options.nodesAsClient.concat(options.nodesAsServer)
    const nodesToConnect = getNodesToConnect(nodes, payload)

    console.log('payload: ' + payload)
    console.log('nodes: ' + nodes)
    console.log('nodesToConnect: ' + nodesToConnect)

    if(nodesToConnect.length > 0) {
        options.connectToPool(nodesToConnect)
        options.clients.forEach(client => client.emit('nodes-to-connect', nodesToConnect))
        options.server.emit('nodes-to-connect', nodesToConnect)
    }
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