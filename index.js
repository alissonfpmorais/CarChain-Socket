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
    server: socketServer(socketPort),
    clients: [],
    nodesAsServer: [],
    nodesAsClient: [],
    connectTo: connectTo,
    connectToPool: connectToPool,
    selfCheck: selfCheck
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
    client.run(ioc, getOptions, ip)
}

function connectToPool(nodesToConnect) {
    nodesToConnect.forEach(node => {
        const nodes = options.nodesAsClient.concat(options.nodesAsServer)
        if(nodes.notHas(node)) connectTo(node)
    })
}

function getOptions() {
    return options
}

function selfCheck() {
    return (this.externalIp !== undefined) &&
        (this.server !== undefined) &&
        (this.clients !== undefined) &&
        (this.nodesAsServer !== undefined) &&
        (this.nodesAsClient !== undefined) &&
        (this.connectTo !== undefined) &&
        (this.connectToPool !== undefined)
}

function run(externalIp) {
    options.externalIp = externalIp
    options.nodesAsServer.push(externalIp)

    http.run(getOptions)
    server.run(options.server, getOptions)
}

getExternalIpAddress()