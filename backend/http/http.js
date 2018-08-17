const express = require('express')
const path = require('path')
const app = express()
const port = 3000

function run(getOptions) {
    app.get('/', (req, res) => {
        const indexPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'index.html')
        res.sendFile(indexPath)
    })

    app.get('/nodes', (req, res) => {
        const options = getOptions()
        const nodes = options.nodesAsClient.concat(options.nodesAsServer)

        res.send(nodes)
    })

    app.get('/connect/:ip', (req, res) => {
        const options = getOptions()
        const ip = req.params.ip

        options.connectTo(ip)
    })

    app.listen(port, () => console.log('listening on ' + port))
}

module.exports = { run }