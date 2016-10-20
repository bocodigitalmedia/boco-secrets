// Generated by CoffeeScript 1.11.1
(function() {
  var Dependencies, configure,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  Dependencies = (function() {
    Dependencies.prototype.Minimist = null;

    Dependencies.prototype.Path = null;

    Dependencies.prototype.Secrets = null;

    Dependencies.prototype.process = null;

    function Dependencies(props) {
      var key, val;
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.process == null) {
        this.process = (function() {
          try {
            return process;
          } catch (error1) {}
        })();
      }
      if (typeof require === 'function') {
        if (this.Minimist == null) {
          this.Minimist = require('minimist');
        }
        if (this.Path == null) {
          this.Path = require('path');
        }
        if (this.Secrets == null) {
          this.Secrets = require('.').Secrets;
        }
      }
    }

    return Dependencies;

  })();

  configure = function(props) {
    var CLI, Minimist, Path, Secrets, dependencies, main, process, ref;
    ref = dependencies = new Dependencies(props), Minimist = ref.Minimist, Path = ref.Path, Secrets = ref.Secrets, process = ref.process;
    CLI = (function() {
      CLI.prototype.process = null;

      function CLI(props) {
        var key, val;
        for (key in props) {
          if (!hasProp.call(props, key)) continue;
          val = props[key];
          this[key] = val;
        }
        if (this.process == null) {
          this.process = process;
        }
      }

      CLI.prototype.set = function(secrets, sourceKey, pointer, value) {
        if (!((secrets != null) && (sourceKey != null) && (pointer != null) && (value != null))) {
          return this.help();
        }
        return secrets.set(sourceKey, pointer, value, (function(_this) {
          return function(error) {
            if (error != null) {
              return _this.handleError(error);
            }
            return _this.process.exit(0);
          };
        })(this));
      };

      CLI.prototype.unset = function(secrets, sourceKey, pointer) {
        if (!((secrets != null) && (sourceKey != null) && (pointer != null ? pointer.length : void 0))) {
          return this.help();
        }
        return secrets.set(sourceKey, pointer, void 0, (function(_this) {
          return function(error) {
            if (error != null) {
              return _this.handleError(error);
            }
            return _this.process.exit(0);
          };
        })(this));
      };

      CLI.prototype.get = function(secrets, sourceKey, pointer) {
        if (!((secrets != null) && (sourceKey != null) && (pointer != null ? pointer.length : void 0))) {
          return this.help();
        }
        return secrets.get(sourceKey, pointer, (function(_this) {
          return function(error, value) {
            var json;
            if (error != null) {
              return _this.handleError(error);
            }
            json = JSON.stringify(value, null, 2);
            _this.process.stdout.write(json + "\n");
            return _this.process.exit(0);
          };
        })(this));
      };

      CLI.prototype.remove = function(secrets, sourceKey) {};

      CLI.prototype.write = function(secrets, sourceKey) {
        var json;
        if (!(sourceKey != null ? sourceKey.length : void 0)) {
          return this.help();
        }
        json = "";
        this.process.stdin.resume();
        this.process.stdin.on('data', function(buf) {
          return json += buf.toString();
        });
        return this.process.stdin.once('end', (function(_this) {
          return function() {
            return secrets.write(sourceKey, JSON.parse(json), function(error) {
              if (error != null) {
                return _this.handleError(error);
              }
              return _this.process.exit(0);
            });
          };
        })(this));
      };

      CLI.prototype.read = function(secrets, sourceKey) {
        if (!(sourceKey != null ? sourceKey.length : void 0)) {
          return this.help();
        }
        return secrets.read(sourceKey, (function(_this) {
          return function(error, data) {
            var json;
            if (error != null) {
              return _this.handleError(error);
            }
            json = JSON.stringify(data, null, 2);
            _this.process.stdout.write(json + "\n");
            return _this.process.exit(0);
          };
        })(this));
      };

      CLI.prototype.help = function() {
        this.process.stdout.write(this.getHelpMessage());
        return this.process.exit(0);
      };

      CLI.prototype.exec = function(secrets, command, args, options) {
        var cmd, commands, fn, ref1;
        if (command == null) {
          command = "help";
        }
        if (options == null) {
          options = {};
        }
        cmd = command.toLowerCase();
        commands = ['read', 'write', 'set', 'unset', 'get', 'help'];
        fn = indexOf.call(commands, cmd) >= 0 ? cmd : 'help';
        return (ref1 = this[fn]).call.apply(ref1, [this, secrets].concat(slice.call(args), [options]));
      };

      CLI.prototype.main = function() {
        var args, options, ref1;
        ref1 = this.processArgv(), args = ref1.args, options = ref1.options;
        return this.getSecrets(options, (function(_this) {
          return function(error, secrets) {
            var command;
            if (error != null) {
              return _this.handleError(error);
            }
            command = args[0];
            args = args.slice(1);
            return _this.exec(secrets, command, args, options);
          };
        })(this));
      };

      CLI.prototype.defaultSecretsFactory = function(options, done) {
        var algorithm, basePath, encryption, error, fileStore, ref1, ref2, ref3, secretKey, secrets;
        try {
          secretKey = (ref1 = options.secret) != null ? ref1 : this.process.env.BOCO_ENCRYPTION_SECRET_KEY;
          algorithm = (ref2 = options.algorithm) != null ? ref2 : this.process.env.BOCO_ENCRYPTION_ALGORITHM;
          basePath = (ref3 = options.basepath) != null ? ref3 : this.process.env.BOCO_SECRETS_BASE_PATH;
          encryption = require('boco-encryption').cipherIv({
            secretKey: secretKey,
            algorithm: algorithm
          });
          fileStore = require('boco-file-store').fileSystem({
            basePath: basePath
          });
          return secrets = new Secrets({
            encryption: encryption,
            fileStore: fileStore
          });
        } catch (error1) {
          error = error1;
        } finally {
          if (error != null) {
            return done(error);
          }
          return done(null, secrets);
        }
      };

      CLI.prototype.getSecrets = function(options, done) {
        var factory;
        factory = (function(_this) {
          return function() {
            var factoryPath, key, otherOptions, ref1, val;
            otherOptions = (function() {
              var results;
              results = [];
              for (key in options) {
                if (!hasProp.call(options, key)) continue;
                val = options[key];
                if (key !== 'factory') {
                  results.push(key);
                }
              }
              return results;
            })();
            if (options.factory === false || otherOptions.length) {
              return _this.defaultSecretsFactory.bind(_this, options);
            }
            factoryPath = (ref1 = options.factory) != null ? ref1 : './boco-secrets-factory.js';
            return factory = (function() {
              var error;
              try {
                factory = require(Path.resolve(factoryPath));
              } catch (error1) {
                error = error1;
              } finally {
                if ((error != null) && error.code !== 'MODULE_NOT_FOUND') {
                  return done(error);
                }
                if ((factory != null) && typeof factory !== 'function') {
                  return done(Error("Invalid factory."));
                }
                if (factory == null) {
                  return _this.defaultSecretsFactory.bind(_this, options);
                }
              }
              return factory;
            })();
          };
        })(this)();
        return factory(done);
      };

      CLI.prototype.getHelpMessage = function() {
        return "usage: boco-secrets <command> [<args...>] <options>\n\ncommands:\n\n  set   <source> <pointer> <value>\n  unset <source> <pointer>\n  get   <source> <pointer>\n  write <source> < stdin\n  read  <source> > stdout\n  help\n\nargs:\n\n  <source> the key specifying which file to use for read/write\n  <pointer> a JSON pointer specifying the operation target\n\noptions:\n\n  --algorithm <encryption-algorithm>\n    Specify the cipher algorithm for encryption.\n    Defaults to $BOCO_ENCRYPTION_ALGORITHM or 'aes-256-ctr'.\n\n  --secret <encryption-secret-key>\n    Specify the secret key used for encryption.\n    Defaults to $BOCO_ENCRYPTION_SECRET_KEY\n\n  --basepath <file-store-base-path>\n    Specify the base path used to store secret sources.\n    Defaults to $BOCO_SECRETS_BASE_PATH or '.'.\n\n  --factory <path-to-factory-js>\n    Specify an alternative path to the factory.js file.\n    Defaults to './boco-secrets-factory.js'\n\n  --no-factory\n    Ignore any factory.js settings and use options only.\n\nfactory:\n\n  For advanced configuration options, you can create a factory.js\n  file that exports a single async function, and calls back with\n  a configured instance of `BocoSecrets.Secrets` to use for all\n  CLI operations.\n\n  Setting any of the following options will ignore the factory\n  entirely: --algorithm, --secret, --basepath.\n";
      };

      CLI.prototype.processArgv = function() {
        var args, argv, key, options, val;
        argv = Minimist(this.process.argv.slice(2));
        options = {};
        for (key in argv) {
          if (!hasProp.call(argv, key)) continue;
          val = argv[key];
          if (key !== '_') {
            options[key] = val;
          }
        }
        args = argv._;
        return {
          options: options,
          args: args
        };
      };

      CLI.prototype.handleError = function(error) {
        this.process.stderr.write(error.stack);
        return process.exit(1);
      };

      return CLI;

    })();
    main = function() {
      return new CLI().main();
    };
    return {
      dependencies: dependencies,
      Dependencies: Dependencies,
      CLI: CLI,
      main: main
    };
  };

  module.exports = configure();

}).call(this);

//# sourceMappingURL=cli.js.map
