import express from 'express'
import config from './../config.js'
import bodyParser from 'body-parser'
import { handleMessage } from './bot.js'
import forceSSL from 'express-force-ssl'
import fs from 'fs'
import https from 'https'
const facebookConfig = {
  pageAccessToken: config.pageAccessToken,
  validationToken: config.validationToken,
}

/*
* Creation of the server
*/

const ssl_options = {
  key: fs.readFileSync('./keys/privkey.pem'),
  cert: fs.readFileSync('./keys/cert.pem')
  //ca: fs.readFileSync('./keys/intermediate.crt')
};

const app = express()

const secureServer = https.createServer(ssl_options, app)

//app.set('port', process.env.PORT || 5000)
app.use(forceSSL);
app.use(bodyParser.json())

secureServer.listen(5000)

/*
* connect your webhook
*/

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
  req.query['hub.verify_token'] === facebookConfig.validationToken) {
    console.log('Validating webhook')
    res.status(200).send(req.query['hub.challenge'])
  } else {
    console.error('Failed validation. Make sure the validation tokens match.')
    res.sendStatus(403)
  }
})

/*
* Take care of the messages
*/

app.post('/webhook', (req, res) => {
  const data = req.body
  if (data.object === 'page') {
    data.entry.forEach(pageEntry => {
      pageEntry.messaging.forEach(messagingEvent => {
        if (messagingEvent.message) {
          if (!messagingEvent.message.is_echo) {
            handleMessage(messagingEvent)
          }
        }
      })
    })
    res.sendStatus(200)
  }
})

app.listen(app.get('port'), () => {
  console.log('Our bot is running on port', app.get('port'))
})
