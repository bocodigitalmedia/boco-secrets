// Generated by CoffeeScript 1.11.1
(function() {
  var Dependencies, configure,
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Dependencies = (function() {
    Dependencies.prototype.JSON = null;

    Dependencies.prototype.JsonPointer = null;

    Dependencies.prototype.LockManager = null;

    Dependencies.prototype.FileStore = null;

    Dependencies.prototype.Encryption = null;

    function Dependencies(props) {
      var key, val;
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.JSON == null) {
        this.JSON = (function() {
          try {
            return JSON;
          } catch (error1) {}
        })();
      }
      if (typeof require === 'function') {
        if (this.JsonPointer == null) {
          this.JsonPointer = require('json-ptr');
        }
        if (this.LockManager == null) {
          this.LockManager = require('boco-mutex').LockManager;
        }
        if (this.FileStore == null) {
          this.FileStore = require('boco-file-store');
        }
        if (this.Encryption == null) {
          this.Encryption = require('boco-encryption');
        }
      }
    }

    return Dependencies;

  })();

  configure = function(props) {
    var CLI, Encryption, FileStore, JSON, JsonPointer, LockManager, Secrets, dependencies, ref;
    ref = dependencies = new Dependencies(props), JSON = ref.JSON, JsonPointer = ref.JsonPointer, LockManager = ref.LockManager, FileStore = ref.FileStore, Encryption = ref.Encryption;
    Secrets = (function() {
      Secrets.prototype.lockManager = null;

      Secrets.prototype.encryption = null;

      Secrets.prototype.fileStore = null;

      function Secrets(props) {
        var key, val;
        for (key in props) {
          if (!hasProp.call(props, key)) continue;
          val = props[key];
          this[key] = val;
        }
        if (this.lockManager == null) {
          this.lockManager = new LockManager;
        }
        if (this.encryption == null) {
          this.encryption = Encryption.cipherIv();
        }
        if (this.fileStore == null) {
          this.fileStore = FileStore.fileSystem();
        }
      }

      Secrets.prototype.lockSync = function(sourceKey, work, done) {
        return this.lockManager.get(sourceKey).sync(work, done);
      };

      Secrets.prototype.writeWithoutLock = function(sourceKey, data, done) {
        var error, json;
        try {
          json = JSON.stringify(data);
        } catch (error1) {
          error = error1;
          if (error != null) {
            return done(error);
          }
        }
        return this.encryption.encrypt(json, (function(_this) {
          return function(error, encrypted) {
            if (error != null) {
              return done(error);
            }
            return _this.fileStore.write(sourceKey, encrypted, done);
          };
        })(this));
      };

      Secrets.prototype.write = function() {
        var args, done, i, ref1, sourceKey, work;
        sourceKey = arguments[0], args = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), done = arguments[i++];
        work = (ref1 = this.writeWithoutLock).bind.apply(ref1, [this, sourceKey].concat(slice.call(args)));
        return this.lockSync(sourceKey, work, done);
      };

      Secrets.prototype.readWithoutLock = function(sourceKey, done) {
        return this.fileStore.read(sourceKey, (function(_this) {
          return function(error, encrypted) {
            if (error != null) {
              return done(error);
            }
            return _this.encryption.decrypt(encrypted, function(error, json) {
              var data;
              if (error != null) {
                return done(error);
              }
              try {
                return data = JSON.parse(json);
              } catch (error1) {
                error = error1;
              } finally {
                if (error != null) {
                  return done(error);
                }
                return done(null, data);
              }
            });
          };
        })(this));
      };

      Secrets.prototype.read = function(sourceKey, done) {
        var work;
        work = this.readWithoutLock.bind(this, sourceKey);
        return this.lockSync(sourceKey, work, done);
      };

      Secrets.prototype.setWithoutLock = function(sourceKey, pointer, value, done) {
        return this.readWithoutLock(sourceKey, (function(_this) {
          return function(error, data) {
            if (error != null) {
              return done(error);
            }
            try {
              return JsonPointer.set(data, pointer, value, true);
            } catch (error1) {
              error = error1;
            } finally {
              if (error != null) {
                return done(error);
              }
              return _this.writeWithoutLock(sourceKey, data, done);
            }
          };
        })(this));
      };

      Secrets.prototype.set = function() {
        var args, done, i, ref1, sourceKey, work;
        sourceKey = arguments[0], args = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), done = arguments[i++];
        work = (ref1 = this.setWithoutLock).bind.apply(ref1, [this, sourceKey].concat(slice.call(args)));
        return this.lockSync(sourceKey, work, done);
      };

      Secrets.prototype.get = function(sourceKey, pointer, done) {
        return this.read(sourceKey, (function(_this) {
          return function(error, data) {
            var value;
            if (error != null) {
              return done(error);
            }
            try {
              return value = JsonPointer.get(data, pointer);
            } catch (error1) {
              error = error1;
            } finally {
              if (error != null) {
                return done(error);
              }
              return done(null, value);
            }
          };
        })(this));
      };

      return Secrets;

    })();
    CLI = require('./cli');
    return {
      configure: configure,
      dependencies: dependencies,
      Dependencies: Dependencies,
      Secrets: Secrets,
      CLI: CLI
    };
  };

  module.exports = configure();

}).call(this);

//# sourceMappingURL=index.js.map
