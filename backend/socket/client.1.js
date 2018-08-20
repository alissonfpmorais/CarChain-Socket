require('../../utils/array')()

const conn = require('./utils/conn')

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

module.exports = { run }