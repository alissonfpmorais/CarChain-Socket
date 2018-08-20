const express = require('express')
const path = require('path')
const app = express()
const port = 3002

function run(options) {
    app.get('/', (req, res) => {
        const indexPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'index.html')
        res.sendFile(indexPath)
    })

    app.get('/nodes', (req, res) => {
        const nodes = options.clientNodes.concat(options.serverNodes)
        res.json(nodes)
    })

    app.get('/connect/:ip', (req, res) => {
        const ip = req.params.ip
        options.connectTo(ip)
    })

    app.listen(port, () => console.log('listening on ' + port))
}

module.exports = { run }