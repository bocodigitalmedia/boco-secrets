secretKey = process.env.SECRET_KEY
encryption = require('boco-encryption').cipherIv {secretKey}
secrets = new (require('./source').Secrets) {encryption}
steps = []

log = console.log

steps.push (done) ->
  log "writing secrets"
  secrets.write "./secrets", shared: { hello: "world" }, done

steps.push (done) ->
  log "reading secrets"
  secrets.read "./secrets", (error, data) ->
    log data
    return done error

steps.push (done) ->
  log "setting foo"
  secrets.set "./secrets", "/shared/foo", "FOO", done

steps.push (done) ->
  log "setting bar"
  secrets.set "./secrets", "/shared/bar", "BAR", done

steps.push (done) ->
  log "getting hello"

  secrets.get './secrets', '/shared/hello', (error, value) ->
    log "hello", value
    done error

steps.push (done) ->
  secrets.read "./secrets", (error, data) ->
    console.log data
    done error

require("async").series steps, (error) ->
  console.log "error", error?
  throw error if error?
  #process.exit 0
