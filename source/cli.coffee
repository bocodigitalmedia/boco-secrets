class Dependencies
  Minimist: null
  Path: null
  Secrets: null
  process: null

  constructor: (props) ->
    @[key] = val for own key, val of props

    @process ?= try process

    if typeof require is 'function'
      @Minimist ?= require 'minimist'
      @Path ?= require 'path'
      @Secrets ?= require('.').Secrets

configure = (props) ->
  {
    Minimist
    Path
    Secrets
    process
  } = dependencies = new Dependencies props

  class CLI
    process: null

    constructor: (props) ->
      @[key] = val for own key, val of props
      @process ?= process

    set: (secrets, sourceKey, pointer, value) ->
      return @help() unless secrets? and sourceKey? and pointer? and value?

      secrets.set sourceKey, pointer, value, (error) =>
        return @handleError error if error?
        @process.exit 0

    unset: (secrets, sourceKey, pointer) ->
      return @help() unless secrets? and sourceKey? and pointer?.length

      secrets.set sourceKey, pointer, undefined, (error) =>
        return @handleError error if error?
        @process.exit 0

    get: (secrets, sourceKey, pointer) ->
      return @help() unless secrets? and sourceKey? and pointer?.length

      secrets.get sourceKey, pointer, (error, value) =>
        return @handleError error if error?
        json = JSON.stringify value, null, 2
        @process.stdout.write json + "\n"
        @process.exit 0

    remove: (secrets, sourceKey) ->

    write: (secrets, sourceKey) ->
      return @help() unless sourceKey?.length

      json = ""

      @process.stdin.resume()

      @process.stdin.on 'data', (buf) ->
        json += buf.toString()

      @process.stdin.once 'end', =>
        secrets.write sourceKey, JSON.parse(json), (error) =>
          return @handleError error if error?
          @process.exit 0

    read: (secrets, sourceKey) ->
      return @help() unless sourceKey?.length

      secrets.read sourceKey, (error, data) =>
        return @handleError error if error?
        json = JSON.stringify data, null, 2
        @process.stdout.write json + "\n"
        @process.exit 0

    help: ->
      @process.stdout.write @getHelpMessage()
      @process.exit 0

    exec: (secrets, command = "help", args, options = {}) ->
      cmd = command.toLowerCase()
      commands = ['read', 'write', 'set', 'unset', 'get', 'help']
      fn = if cmd in commands then cmd else 'help'
      @[fn].call @, secrets, args..., options

    main: ->
      {args, options} = @processArgv()

      @getSecrets options, (error, secrets) =>
        return @handleError error if error?
        command = args[0]
        args = args.slice 1
        @exec secrets, command, args, options

    defaultSecretsFactory: (options, done) ->
      try
        secretKey = options.secret ? @process.env.BOCO_ENCRYPTION_SECRET_KEY
        algorithm = options.algorithm ? @process.env.BOCO_ENCRYPTION_ALGORITHM
        basePath = options.basepath ? @process.env.BOCO_SECRETS_BASE_PATH
        encryption = require('boco-encryption').cipherIv {secretKey, algorithm}
        fileStore = require('boco-file-store').fileSystem {basePath}
        secrets = new Secrets {encryption, fileStore}
      catch error
      finally
        return done error if error?
        return done null, secrets

    getSecrets: (options, done) ->
      factory = do =>

        otherOptions = (key for own key, val of options when key isnt 'factory')
        if options.factory is false or otherOptions.length
          return @defaultSecretsFactory.bind @, options

        factoryPath = options.factory ? './boco-secrets-factory.js'

        factory = do =>
          try
            factory = require Path.resolve(factoryPath)
          catch error
          finally
            return done error if error? and error.code isnt 'MODULE_NOT_FOUND'
            return done Error("Invalid factory.") if factory? and typeof factory isnt 'function'
            return @defaultSecretsFactory.bind @, options unless factory?
          return factory

      factory done

    getHelpMessage: ->
      """
      usage: boco-secrets <command> [<args...>] <options>

      commands:

        set   <source> <pointer> <value>
        unset <source> <pointer>
        get   <source> <pointer>
        write <source> < stdin
        read  <source> > stdout
        help

      args:

        <source> the key specifying which file to use for read/write
        <pointer> a JSON pointer specifying the operation target

      options:

        --algorithm <encryption-algorithm>
          Specify the cipher algorithm for encryption.
          Defaults to $BOCO_ENCRYPTION_ALGORITHM or 'aes-256-ctr'.

        --secret <encryption-secret-key>
          Specify the secret key used for encryption.
          Defaults to $BOCO_ENCRYPTION_SECRET_KEY

        --basepath <file-store-base-path>
          Specify the base path used to store secret sources.
          Defaults to $BOCO_SECRETS_BASE_PATH or '.'.

        --factory <path-to-factory-js>
          Specify an alternative path to the factory.js file.
          Defaults to './boco-secrets-factory.js'

        --no-factory
          Ignore any factory.js settings and use options only.

      factory:

        For advanced configuration options, you can create a factory.js
        file that exports a single async function, and calls back with
        a configured instance of `BocoSecrets.Secrets` to use for all
        CLI operations.

        Setting any of the following options will ignore the factory
        entirely: --algorithm, --secret, --basepath.

      """

    processArgv: ->
      argv = Minimist @process.argv.slice(2)
      options = {}
      options[key] = val for own key, val of argv when key isnt '_'
      args = argv._
      {options, args}

    handleError: (error) ->
      @process.stderr.write error.stack
      process.exit 1


  main = ->
    new CLI().main()

  {
    dependencies
    Dependencies
    CLI
    main
  }

module.exports = configure()
