const socketClient = require('socket.io-client')
const socketServer = require('socket.io')
const request = require('request')

const http = require('./backend/http/http')
const client = require('./backend/socket/client')
const server = require('./backend/socket/server')

const metaDataUrl = 'http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip';
const socketPort = 3001

const options = {
    externalIp: undefined,
    clients: [],
    serverNodes: [],
    clientNodes: [],
    connectTo: connectTo,
    connectToPool: connectToPool
}

function getExternalIpAddress(doAfterRequest) {
    const opts = {
        url: metaDataUrl,
        headers: { 'Metadata-Flavor': 'Google' }
    }

    request(opts, (err, resp, body) => {
        if (err || resp.statusCode !== 200) {
            console.log('Error while talking to metadata server, assuming localhost');
            return run('localhost')
        }

        return run(body)
    })
}

function connectTo(ip) {
    const ioc = socketClient('http://' + ip + ':' + socketPort)
    client.run(ioc, options, ip)
}

function connectToPool(nodesToConnect) {
    nodesToConnect.forEach(node => {
        const nodes = options.clientNodes.concat(options.serverNodes)
        if(nodes.notHas(node)) connectTo(node)
    })
}

function showStatus() {
    console.log('-------------------------------------------------')
    console.log('Status')
    console.log('Living nodes: ' + options.clientNodes.concat(options.serverNodes))

    setTimeout(() => showStatus(), 30000)
}

function run(externalIp) {
    options.externalIp = externalIp
    options.serverNodes.push(externalIp)

    http.run(options)
    server.run(socketServer(socketPort), options)
    showStatus()
}

getExternalIpAddress()