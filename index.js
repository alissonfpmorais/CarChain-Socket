const os = require('os')
const express = require('express')
const server = require('socket.io')
const client = require('socket.io-client')

const port = 3001
const ios = server(port)
const app = express()

const connectionList = []
const nodeList = []
const ifaces = os.networkInterfaces()
const localIp = getLocalIpAddress()

nodeList.push(localIp)
ios.on('connection', onConnectionEstablished(client))

app.get('/:ip', function(req, res) {
    const ip = req.params.ip
    const ioc = client('http://' + ip + ':' + port)

    ioc.on('node-list', populateNetwork(client))
})

app.listen(3002, function() {
    console.log('listening on 3002')
})

function getLocalIpAddress() {
    return Object.keys(ifaces)
        .filter(ifname => ifname === 'ens4')
        .map(ifname => {
            const ip = ifaces[ifname]
                .filter(iface => iface.family === 'IPv4')
                .map(iface => iface.address)
                .reduce(address => address)

            return ip
        })[0]
}

function getRemoteIpAddress(remoteAddress) {
    return remoteAddress.replace('::ffff:', '')
}

function onConnectionEstablished(ioClient) {
    return function(socket) {
        console.log('user connected')

        console.log('nodeList1')
        console.log(nodeList)

        const remoteIp = getRemoteIpAddress(socket.conn.remoteAddress)
        if (nodeList.notHas(remoteIp)) nodeList.push(remoteIp)

        console.log('nodeList2')
        console.log(nodeList)

        socket.broadcast.emit('node-list', rNodeList())
        socket.on('disconnect', () => console.log('user disconnected'))
    }
}

function rNodeList() {
    console.log('broadcasting...')
    return nodeList
}

function populateNetwork(ioClient) {
    return function(nodes) {
        console.log('populate')
        console.log('nodeList3')
        console.log(nodeList)
        console.log('nodes3')
        console.log(nodes)

        const nodesToConnect = []

        if (nodeList.length >= nodes) nodesToConnect.push(nodeList.diff(nodes))
        else nodesToConnect.push(nodes.diff(nodeList))
    
        nodesToConnect
            .filter(ip => nodeList.notHas(ip))
            .forEach(ip => {
                console.log('nodesToConnect forEach2')
                const ioc = ioClient('http://' + ip + ':' + port)

                ioc.on('connect', () => {
                    connectionList.push(ioc)
                    nodeList.push(ip)
                })
            })
    }
}

Array.prototype.has = function(value) {
    return this.indexOf(value) >= 0
}

Array.prototype.notHas = function(value) {
    return !this.has(value)
}

Array.prototype.isEmpty = function() {
    return this.length <= 0
}

Array.prototype.isNotEmpty = function() {
    return !this.isEmpty()
}

Array.prototype.diff = function(arr) {
    return this.filter(item => arr.indexOf(item) < 0)
}