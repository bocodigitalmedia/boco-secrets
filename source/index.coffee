class Dependencies
  JSON: null
  JsonPointer: null
  LockManager: null
  FileStore: null
  Encryption: null

  constructor: (props) ->
    @[key] = val for own key, val of props

    @JSON ?= try JSON

    if typeof require is 'function'
      @JsonPointer ?= require 'json-ptr'
      @LockManager ?= require('boco-mutex').LockManager
      @FileStore ?= require 'boco-file-store'
      @Encryption ?= require 'boco-encryption'

configure = (props) ->
  {
    JSON
    JsonPointer
    LockManager
    FileStore
    Encryption

  } = dependencies = new Dependencies props

  class Secrets
    lockManager: null
    encryption: null
    fileStore: null

    constructor: (props) ->
      @[key] = val for own key, val of props
      @lockManager ?= new LockManager
      @encryption ?= Encryption.cipherIv()
      @fileStore ?= FileStore.fileSystem()

    lockSync: (sourceKey, work, done) ->
      @lockManager.get(sourceKey).sync work, done

    writeWithoutLock: (sourceKey, data, done) ->
      try
        json = JSON.stringify data
      catch error
        return done error if error?

      @encryption.encrypt json, (error, encrypted) =>
        return done error if error?
        return @fileStore.write sourceKey, encrypted, done

    write: (sourceKey, args..., done) ->
      work = @writeWithoutLock.bind @, sourceKey, args...
      @lockSync sourceKey, work, done

    readWithoutLock: (sourceKey, done) ->
      @fileStore.read sourceKey, (error, encrypted) =>
        return done error if error?

        @encryption.decrypt encrypted, (error, json) =>
          return done error if error?

          try
            data = JSON.parse json
          catch error
          finally
            return done error if error?
            return done null, data

    read: (sourceKey, done) ->
      work = @readWithoutLock.bind @, sourceKey
      @lockSync sourceKey, work, done

    setWithoutLock: (sourceKey, pointer, value, done) ->
      @readWithoutLock sourceKey, (error, data) =>
        return done error if error?

        try
          JsonPointer.set data, pointer, value, true
        catch error
        finally
          return done error if error?
          return @writeWithoutLock sourceKey, data, done

    set: (sourceKey, args..., done) ->
      work = @setWithoutLock.bind @, sourceKey, args...
      @lockSync sourceKey, work, done

    get: (sourceKey, pointer, done) ->
      @read sourceKey, (error, data) =>
        return done error if error?

        try
          value = JsonPointer.get data, pointer
        catch error
        finally
          return done error if error?
          return done null, value

  {
    configure
    dependencies
    Dependencies
    Secrets
  }

module.exports = configure()
