
var basename = require('path').basename
var depd = require('..')
var mylib = require('./fixtures/my-lib')
var should = require('should')

describe('depd(namespace)', function () {
  it('creates deprecated function', function () {
    depd('test').should.be.a.function
  })

  it('requires namespace', function () {
    depd.bind().should.throw(/namespace.*required/)
  })
})

describe('deprecate(message)', function () {
  it('should log namespace', function () {
    function callold() { mylib.old() }
    captureStderr(callold).should.containEql('my-lib')
  })

  it('should log deprecation', function () {
    function callold() { mylib.old() }
    captureStderr(callold).should.containEql('deprecate')
  })

  it('should log message', function () {
    function callold() { mylib.old() }
    captureStderr(callold).should.containEql('old')
  })

  it('should log call site', function () {
    function callold() { mylib.old() }
    var stderr = captureStderr(callold)
    stderr.should.containEql(basename(__filename))
    stderr.should.match(/\.js:[0-9]+:[0-9]+/)
  })

  it('should log call site within eval', function () {
    function callold() { eval('mylib.old()') }
    var stderr = captureStderr(callold)
    stderr.should.containEql(basename(__filename))
    stderr.should.containEql('<anonymous>:1:')
    stderr.should.match(/\.js:[0-9]+:[0-9]+/)
  })

  it('should only warn once per call site', function () {
    function callold() {
      for (var i = 0; i < 5; i++) {
        mylib.old() // single call site
        process.stderr.write('invoke ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    stderr.split('deprecated').should.have.length(2)
    stderr.split('invoke').should.have.length(6)
  })

  it('should warn for different fns on same call site', function () {
    var prop

    function callold() {
      mylib[prop]() // call from same site
    }

    prop = 'old'
    captureStderr(callold).should.containEql(basename(__filename))

    prop = 'old2'
    captureStderr(callold).should.containEql(basename(__filename))
  })

  it('should warn for different calls on same line', function () {
    function callold() {
      mylib.old(), mylib.old()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    stderr.should.containEql(basename(__filename))
    stderr.split('deprecated').should.have.length(3)
    stderr.split(fileline[0]).should.have.length(3)
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold() { mylib.automsgnamed() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.automsgnamed ')
    })

    it('should generate message for function call on named function', function () {
      function callold() {
        var fn = mylib.automsgnamed
        fn()
      }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' automsgnamed ')
    })

    it('should generate message for method call on unnamed function', function () {
      function callold() { mylib.automsg() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.exports.automsg ')
    })

    it('should generate message for function call on unnamed function', function () {
      function callold() {
        var fn = mylib.automsg
        fn()
      }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' exports.automsg ')
    })

    it('should generate message for function call on anonymous function', function () {
      function callold() { mylib.automsganon() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.match(/ exports\.automsganon | <anonymous@[^:]+:[0-9]+:[0-9]+> /)
    })
  })

  describe('when output supports colors', function () {
    var stderr
    before(function () {
      function callold() { mylib.old() }
      stderr = captureStderr(callold, true)
    })

    it('should log in color', function () {
      stderr.should.not.be.empty
      stderr.should.containEql('\x1b[')
    })

    it('should log namespace', function () {
      stderr.should.containEql('my-lib')
    })

    it('should log deprecation', function () {
      stderr.should.containEql('deprecate')
    })

    it('should log message', function () {
      stderr.should.containEql('old')
    })

    it('should log call site', function () {
      stderr.should.containEql(basename(__filename))
      stderr.should.match(/\.js:[0-9]+:[0-9]+/)
    })
  })

  describe('when output does not support colors', function () {
    var stderr
    before(function () {
      function callold() { mylib.old() }
      stderr = captureStderr(callold, false)
    })

    it('should not log in color', function () {
      stderr.should.not.be.empty
      stderr.should.not.containEql('\x1b[')
    })

    it('should log namespace', function () {
      stderr.should.containEql('my-lib')
    })

    it('should log timestamp', function () {
      stderr.should.match(/\w+, \d+ \w+ \d{4} \d{2}:\d{2}:\d{2} \w{3}/)
    })

    it('should log deprecation', function () {
      stderr.should.containEql('deprecate')
    })

    it('should log message', function () {
      stderr.should.containEql('old')
    })

    it('should log call site', function () {
      stderr.should.containEql(basename(__filename))
      stderr.should.match(/\.js:[0-9]+:[0-9]+/)
    })
  })
})

describe('deprecate.function(fn, message)', function () {
  it('should log on call to function', function () {
    function callold() { mylib.oldfn() }
    captureStderr(callold).should.containEql(' oldfn ')
  })

  it('should have same arity', function () {
    mylib.oldfn.should.have.length(2)
  })

  it('should pass arguments', function () {
    var ret
    function callold() { ret = mylib.oldfn(1, 2) }
    captureStderr(callold).should.containEql(' oldfn ')
    ret.should.equal(2)
  })

  it('should only warn once per call site', function () {
    function callold() {
      for (var i = 0; i < 5; i++) {
        mylib.oldfn() // single call site
        process.stderr.write('invoke ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    stderr.split('deprecated').should.have.length(2)
    stderr.split('invoke').should.have.length(6)
  })

  it('should warn for different calls on same line', function () {
    function callold() {
      mylib.oldfn(), mylib.oldfn()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    stderr.should.containEql(basename(__filename))
    stderr.split('deprecated').should.have.length(3)
    stderr.split(fileline[0]).should.have.length(3)
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold() { mylib.oldfnauto() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.fn ')
      stderr.should.match(/ at [^:]+test\.js:/)
    })

    it('should generate message for method call on anonymous function', function () {
      function callold() { mylib.oldfnautoanon() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.match(/ <anonymous@[^:]+my-lib\.js:[0-9]+:[0-9]+> /)
      stderr.should.match(/ at [^:]+test\.js:/)
    })
  })
})

function captureStderr(fn, color) {
  var chunks = []
  var isTTY = process.stderr.isTTY
  var write = process.stderr.write

  process.stderr.isTTY = Boolean(color)
  process.stderr.write = function write(chunk, encoding) {
    chunks.push(new Buffer(chunk, encoding))
  }

  try {
    fn()
  } finally {
    process.stderr.isTTY = isTTY
    process.stderr.write = write
  }

  return Buffer.concat(chunks).toString('utf8')
}
