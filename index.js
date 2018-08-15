const os = require('os')
const express = require('express')
const request = require('request')
const server = require('socket.io')
const client = require('socket.io-client')

const METADATA_NETWORK_INTERFACE_URL = 'http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip';
const port = 3001
const ios = server(port)
const app = express()

const connectionList = []
const nodeList = []

getLocalIpAddress((res) => nodeList.push(res))
ios.on('connection', onConnectionEstablished(client))

app.get('/:ip', function(req, res) {
    const ip = req.params.ip
    const ioc = client('http://' + ip + ':' + port)

    ioc.on('connect', () => {
        if (nodeList.notHas(ip)) nodeList.push(ip)
    })
    
    ioc.on('node-list', populateNetwork(client))
})

app.listen(3002, function() {
    console.log('listening on 3002')
})

function getLocalIpAddress(doAfterRequest) {
    const options = {
        url: METADATA_NETWORK_INTERFACE_URL,
        headers: { 'Metadata-Flavor': 'Google' }
    }

    request(options, (err, resp, body) => {
        if (err || resp.statusCode !== 200) {
            console.log('Error while talking to metadata server, assuming localhost');
            return doAfterRequest('localhost')
        }

        return doAfterRequest(body)
    })
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