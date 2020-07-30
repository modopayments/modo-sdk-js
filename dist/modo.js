'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const crypto = require('crypto')
const https = require('https')
// import {Logger} from "pino";
const P = require('pino')
const auth_1 = require('./auth')
// const logger: Logger = P();
const keepalive = require('agentkeepalive')
const qs = require('qs')
const DATE_HEADER = 'X-Modo-Date'
const AUTH_HEADER = 'Authorization'
const CALLREF_HEADER = 'Call-Ref'
class Modo {
  constructor(location, credentials, useKeepAliveAgent = false, timeout = 60000, logger) {
    this.logger = logger == null ? P() : logger
    if (useKeepAliveAgent) {
      this.Agent = new keepalive.HttpsAgent({
        maxSockets: 100,
        timeout,
      })
    } else {
      this.Agent = new https.Agent({
        timeout,
      })
    }
    this.location = location
    this.credentials = credentials
  }
  vaultEncrypt(data, credentials = this.credentials) {
    return this._getKey(credentials).then(key => {
      return crypto.publicEncrypt({ key }, data)
    })
  }
  query(
    endpoint,
    params = {},
    locationOverride,
    credentials = this.credentials,
    authType = 'MODO2',
    json = true,
    callRef
  ) {
    if (credentials == null && authType !== 'NONE') {
      return Promise.reject('No valid credentials provided')
    }
    let body
    const location = locationOverride != null ? locationOverride : this.location
    const uri = location.base + endpoint
    const headers = {}
    if (json) {
      body = JSON.stringify(params)
    } else {
      body = params ? qs.stringify(params, { encodeValuesOnly: true }) : ''
    }
    // TODO: add the following
    // additional logging
    // full uri
    // body that is sent
    // TODO: build and publish to npm (ours) (as modo-sdk-js)
    const hostname = location.api_url
    const agent = this.Agent
    const port = location.port || 443
    const sig = auth_1.ModoSignatures[authType](uri, body, credentials)
    if (callRef != null) {
      headers[CALLREF_HEADER] = callRef
    }
    headers[DATE_HEADER] = sig.timestamp
    headers[AUTH_HEADER] = sig.signature
    headers['Content-Type'] = json
      ? 'application/json'
      : 'application/x-www-form-urlencoded'

    this.logger.info({
      endpoint: `https://${hostname}${uri}`,
      port,
      body,
    })
    return new Promise((resolve, reject) => {
      'use strict'
      let responseBody = ''
      const req = https.request(
        {
          agent,
          headers,
          hostname,
          method: 'POST',
          path: uri,
          port,
        },
        res => {
          'use strict'
          res.setEncoding('utf8')
          res.on('data', chunk => {
            responseBody += chunk
          })
          res.on('end', () => {
            try {
              const responseData = JSON.parse(responseBody)

              this.logger.debug({ callRef: responseData.call_reference, endpoint })
              if (res.statusCode === 401) {
                this.logger.error(res, 'Request Auth Failure')
                resolve(responseData)
              } else if (res.statusCode >= 300) {
                resolve(responseData)
              } else {
                resolve(responseData)
              }
            } catch (err) {
              this.logger.error('Failed to parse modo response')
              this.logger.error(responseBody)
              reject(err)
            }
          })
        }
      )

      req.setNoDelay(true)
      req.on('end', err => {
        'use strict'
        this.logger.error(err, 'Modo request died')
        resolve(err)
      })
      req.on('error', err => {
        this.logger.error(err, 'Modo request died')
        reject(err)
      })
      req.write(body, 'utf8')
      req.end()
    })
  }
  _getKey(credentials = this.credentials) {
    if (this.vaultEncKeyProm != null) {
      return this.vaultEncKeyProm
    }
    if (this.vaultEncKey == null) {
      let vaultEncKey = this.vaultEncKey
      // FIXME: find out if this should care about more than just BLOB_DATA key
      this.vaultEncKeyProm = this.query(
        '/vault/get_encryption_key',
        {
          MODO_AUTH: credentials.key,
          type: 'BLOB_DATA',
        },
        null,
        credentials
      ).then(
        response => {
          vaultEncKey = response.response_data.encryption_key
          return vaultEncKey
        },
        err => {
          this.logger.error('Failed to acquire vault encryption key')
          throw new Error('Failed to acquire vault key')
        }
      )
      return this.vaultEncKeyProm
    } else {
      return Promise.resolve(this.vaultEncKey)
    }
  }
}
exports.Modo = Modo
