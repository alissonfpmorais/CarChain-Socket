require('../../../utils/array')()
const patterns = require('../../../utils/patterns')

const keys = {
    forceDisconnect: 'force-disconnect',
    nodeList: 'node-list',
    client: {
        connect: 'connect',
        reconnect: 'reconnect',
        disconnect: 'disconnect'
    },
    server: {
        connect: 'connection',
        disconnect: 'disconnect'
    }
}

function getRemoteIpAddress(remoteAddress) {
    return remoteAddress.replace('::ffff:', '')
}

function sendingNodes(options) {
    const tryNodes = new patterns.Try(() => options.clientNodes.concat(options.serverNodes))

    return tryNodes
        .doOnSuccess(nodes => {
            console.log('sending nodes')
            io.emit(conn.keys.nodeList, nodes)
        })
        .doOnFailure(() => console.log('error sending nodes'))
        .map(nodes => nodes.length >= 0)
        .getOrElse(() => false)
}

function getNodesToConnect(nodes, payload) {
    console.log('computing nodes to connect')
    const nodesToConnect = payload.diff(nodes)

    return nodesToConnect
}

function spreadTheWord(io, options, payload) {
    console.log('spread the word')
    console.log('payload: ' + payload)

    const trySpread = new patterns.Try(() => options.clientNodes.concat(options.serverNodes))

    return trySpread
        .doOnSuccess(nodes => console.log('nodes: ' + nodes))
        .doOnFailure(() => {
            const payload = 'client internal error, closing connection!'
            console.log(payload)
            forceDisconnect(io, payload)
        })
        .map(nodes => getNodesToConnect(nodes, payload))
        .doOnSuccess(nodesToConnect => console.log('nodesToConnect: ' + nodesToConnect))
        .filter(nodesToConnect => nodesToConnect.length > 0)
        .doOnSuccess(nodesToConnect => {
            options.connectToPool(nodesToConnect)
            options.clients.forEach(client => client.emit(keys.nodeList, nodesToConnect))
            options.server.emit(keys.nodeList, nodesToConnect)
        })
        .doOnFailure(() => console.log('No nodes to connect'))
        .map(nodesToConnect => nodesToConnect !== undefined)
        .getOrElse(() => false)
}

function forceDisconnect(io, payload) {
    console.log('payload: ' + payload)
    const tryComm = new patterns.Try(() => payload)

    return tryComm
        .doOnSuccess(p => {
            io.emit(keys.forceDisconnect, p)
            setTimeout(() => io.disconnect(true), 3000)
        })
        .doOnFailure(() => console.log('Can\'t communicate to child'))
        .flatMap(() => new patterns.Try(() => this.value !== undefined))
        .getOrElse(() => false)
}

function onConnectToServer(io, options, remoteIp) {
    return function() {
        const tryConnect = new patterns.Try(() => remoteIp)

        tryConnect
            .doOnSuccess(ip => {
                console.log('establishing connection')
                console.log('node connected to: ' + ip)

                options.clients.push(io)
                options.nodesAsServer.push(remoteIp)
            })
            .doOnFailure(() => forceDisconnect(io, 'client internal error, closing connection!'))

    }
}

function onConnectToClient(io, options, callback) {
    return function(child) {
        const tryOpt = new patterns.Try(() => options.clientNodes.length >= 0 && options.serverNodes.length >= 0)
        const tryConnect = new patterns.Try(() => getRemoteIpAddress(child.conn.remoteAddress))

        tryConnect
            .doOnSuccess(remoteIp => {
                console.log('new node connected')
                console.log('remote ip: ' + remoteIp)

                tryOpt
                    .filter(opt => opt.clientNodes.notHas(remoteIp) && opt.serverNodes.notHas(remoteIp))
                    .doOnSuccess(opt => {
                        opt.clientNodes.push(remoteIp)
                        callback(child, options, remoteIp)
                    })
                    .doOnFailure(() => forceDisconnect(io, 'client internal error, closing connection!'))
            })
            .doOnFailure(() => forceDisconnect(io, 'client internal error, closing connection!'))
    }
}

function onDisconnectFromServer(io, options, remoteIp) {
    const tryDc = new patterns.Try(() => options.serverNodes.length >= 0 && options.clients.length >= 0)

    return tryDc
        .filter(isOptionsValid => isOptionsValid)
        .doOnSuccess(() => {
            options.serverNodes.remove(remoteIp)
            options.clients.remove(io)
        })
        .doOnFailure(() => forceDisconnect(io, 'client internal error, closing connection!'))
}

function onDisconnectFromClient(io, options, remoteIp) {
    const tryDc = new patterns.Try(() => options.clientNodes.length >= 0)

    return tryDc
        .filter(isOptionsValid => isOptionsValid)
        .doOnSuccess(() => options.clientNodes.remove(remoteIp))
        .doOnFailure(() => forceDisconnect(io, 'client internal error, closing connection!'))
}

module.exports = {
    keys,
    sendingNodes,
    getNodesToConnect,
    spreadTheWord,
    forceDisconnect,
    onConnectToServer,
    onConnectToClient,
    onDisconnectFromServer,
    onDisconnectFromClient
}