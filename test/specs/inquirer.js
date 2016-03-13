/**
 * Inquirer public API test
 */

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var rx = require("rx-lite");
var inquirer = require("../../lib/inquirer");

describe("inquirer.prompt", function () {
  beforeEach(function () {
    this.prompt = inquirer.createPromptModule();
  });

  it("should close and create a new readline instances each time it's called", function (done) {
    var ctx = this;
    var rl1;

    var promise = this.prompt({
      type: "confirm",
      name: "q1",
      message: "message"
    }, function () {
      expect(rl1.close.called).to.be.true;
      expect(rl1.output.end.called).to.be.true;

      var rl2;
      var promise2 = ctx.prompt({
        type: "confirm",
        name: "q1",
        message: "message"
      }, function () {
        expect(rl2.close.called).to.be.true;
        expect(rl2.output.end.called).to.be.true;

        expect(rl1).to.not.equal(rl2);
        done();
      });

      rl2 = promise2.ui.rl;
      rl2.emit("line");
    });

    rl1 = promise.ui.rl;
    rl1.emit("line");
  });

  it("should take a prompts array and return answers", function (done) {
    var prompts = [{
      type: "confirm",
      name: "q1",
      message: "message"
    }, {
      type: "confirm",
      name: "q2",
      message: "message",
      default: false
    }];

    var promise = this.prompt(prompts, function (err, answers) {
      expect(answers.q1).to.be.true;
      expect(answers.q2).to.be.false;
      done();
    });

    promise.ui.rl.emit("line");
    promise.ui.rl.emit("line");
  });

  it("should take a single prompt and return answer", function (done) {
    var prompt = {
      type: "input",
      name: "q1",
      message: "message",
      default: "bar"
    };

    var promise = this.prompt(prompt, function (err, answers) {
      expect(answers.q1).to.equal("bar");
      done();
    });

    promise.ui.rl.emit("line");
  });

  it("should parse `message` if passed as a function", function (done) {
    var stubMessage = "foo";
    this.prompt.registerPrompt("stub", function (params) {
      this.opt = {
        when: function () {
          return true;
        }
      };
      this.run = _.noop;
      expect(params.message).to.equal(stubMessage);
      done();
    });

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: function (answers) {
        expect(answers.name1).to.equal("bar");
        return stubMessage;
      }
    }];

    var promise = this.prompt(prompts, function () {});
    promise.ui.rl.emit("line");
  });

  it("should run asynchronous `message`", function (done) {
    var stubMessage = "foo";
    this.prompt.registerPrompt("stub", function (params) {
      this.opt = {
        when: function () {
          return true;
        }
      };
      this.run = _.noop;
      expect(params.message).to.equal(stubMessage);
      done();
    });

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: function (answers) {
        expect(answers.name1).to.equal("bar");
        var goOn = this.async();
        setTimeout(function () {
          goOn(stubMessage);
        }, 0);
      }
    }];

    var promise = this.prompt(prompts, function () {});
    promise.ui.rl.emit("line");
  });

  it("should parse `default` if passed as a function", function (done) {
    var stubDefault = "foo";
    this.prompt.registerPrompt("stub", function (params) {
      this.opt = {
        when: function () {
          return true;
        }
      };
      this.run = _.noop;
      expect(params.default).to.equal(stubDefault);
      done();
    });

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message",
      default: function (answers) {
        expect(answers.name1).to.equal("bar");
        return stubDefault;
      }
    }];

    var promise = this.prompt(prompts, function () {});
    promise.ui.rl.emit("line");
  });

  it("should run asynchronous `default`", function (done) {
    var goesInDefault = false;
    var input2Default = "foo";
    var promise;
    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "input2",
      name: "q2",
      message: "message",
      default: function (answers) {
        goesInDefault = true;
        expect(answers.name1).to.equal("bar");
        var goOn = this.async();
        setTimeout(function () {
          goOn(input2Default);
        }, 0);
        setTimeout(function () {
          promise.ui.rl.emit("line");
        }, 10);
      }
    }];

    promise = this.prompt(prompts, function (err, answers) {
      expect(goesInDefault).to.be.true;
      expect(answers.q2).to.equal(input2Default);
      done();
    });

    promise.ui.rl.emit("line");
  });

  it("should pass previous answers to the prompt constructor", function (done) {
    this.prompt.registerPrompt("stub", function (params, rl, answers) {
      this.run = _.noop;
      expect(answers.name1).to.equal("bar");
      done();
    });

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message"
    }];

    var promise = this.prompt(prompts, function () {});
    promise.ui.rl.emit("line");
  });

  it("should parse `choices` if passed as a function", function (done) {
    var stubChoices = ["foo", "bar"];
    this.prompt.registerPrompt("stub", function (params) {
      this.run = _.noop;
      this.opt = {
        when: function () {
          return true;
        }
      };
      expect(params.choices).to.equal(stubChoices);
      done();
    });

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message",
      choices: function (answers) {
        expect(answers.name1).to.equal("bar");
        return stubChoices;
      }
    }];

    var promise = this.prompt(prompts, function () {});
    promise.ui.rl.emit("line");
  });

  it("should returns a promise", function (done) {
    var prompt = {
      type: "input",
      name: "q1",
      message: "message",
      default: "bar"
    };

    var promise = this.prompt(prompt);
    promise.then(function (answers) {
      expect(answers.q1).to.equal("bar");
      done();
    });

    promise.ui.rl.emit("line");
  });

  it("should expose the Reactive interface", function (done) {
    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "input",
      name: "name",
      message: "message",
      default: "doe"
    }];

    var promise = this.prompt(prompts, function () {});
    var spy = sinon.spy();
    promise.ui.process.subscribe(spy, function () {}, function () {
      sinon.assert.calledWith(spy, {name: "name1", answer: "bar"});
      sinon.assert.calledWith(spy, {name: "name", answer: "doe"});
      done();
    });
    promise.ui.rl.emit("line");
    promise.ui.rl.emit("line");
  });

  it("should expose the UI", function (done) {
    var promise = this.prompt([], function () {});
    expect(promise.ui.answers).to.be.an('object');
    done();
  });

  it("takes an Observable as question", function (done) {
    var promise;
    var prompts = rx.Observable.create(function (obs) {
      obs.onNext({
        type: "confirm",
        name: "q1",
        message: "message"
      });
      setTimeout(function () {
        obs.onNext({
          type: "confirm",
          name: "q2",
          message: "message",
          default: false
        });
        obs.onCompleted();
        promise.ui.rl.emit("line");
      }, 30);
    });

    promise = this.prompt(prompts, function (err, answers) {
      expect(answers.q1).to.be.true;
      expect(answers.q2).to.be.false;
      done();
    });

    promise.ui.rl.emit("line");
  });

  describe("hierarchical mode (`when`)", function () {
    it("should pass current answers to `when`", function (done) {
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        name: "q2",
        message: "message",
        when: function (answers) {
          expect(answers).to.be.an("object");
          expect(answers.q1).to.be.true;
        }
      }];

      var promise = this.prompt(prompts, function () {
        done();
      });

      promise.ui.rl.emit("line");
    });

    it("should run prompt if `when` returns true", function (done) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "bar-var",
        when: function () {
          goesInWhen = true;
          return true;
        }
      }];

      var promise = this.prompt(prompts, function (err, answers) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.equal("bar-var");
        done();
      });

      promise.ui.rl.emit("line");
      promise.ui.rl.emit("line");
    });

    it("should run prompt if `when` is true", function (done) {
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "bar-var",
        when: true
      }];

      var promise = this.prompt(prompts, function (err, answers) {
        expect(answers.q2).to.equal("bar-var");
        done();
      });

      promise.ui.rl.emit("line");
      promise.ui.rl.emit("line");
    });

    it("should not run prompt if `when` returns false", function (done) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "confirm",
        name: "q2",
        message: "message",
        when: function () {
          goesInWhen = true;
          return false;
        }
      }, {
        type: "input",
        name: "q3",
        message: "message",
        default: "foo"
      }];

      var promise = this.prompt(prompts, function (err, answers) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.not.exist;
        expect(answers.q3).to.equal("foo");
        expect(answers.q1).to.be.true;
        done();
      });

      promise.ui.rl.emit("line");
      promise.ui.rl.emit("line");
    });

    it("should not run prompt if `when` is false", function (done) {
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "confirm",
        name: "q2",
        message: "message",
        when: false
      }, {
        type: "input",
        name: "q3",
        message: "message",
        default: "foo"
      }];

      var promise = this.prompt(prompts, function (err, answers) {
        expect(answers.q2).to.not.exist;
        expect(answers.q3).to.equal("foo");
        expect(answers.q1).to.be.true;
        done();
      });

      promise.ui.rl.emit("line");
      promise.ui.rl.emit("line");
    });

    it("should run asynchronous `when`", function (done) {
      var promise;
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "foo-bar",
        when: function () {
          goesInWhen = true;
          var goOn = this.async();
          setTimeout(function () {
            goOn(true);
          }, 0);
          setTimeout(function () {
            promise.ui.rl.emit("line");
          }, 10);
        }
      }];

      promise = this.prompt(prompts, function (err, answers) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.equal("foo-bar");
        done();
      });

      promise.ui.rl.emit("line");
    });
  });

  describe("#registerPrompt()", function () {
    it("register new prompt types", function (done) {
      var questions = [{type: "foo", message: "something"}];
      inquirer.registerPrompt("foo", function (question, rl, answers) {
        expect(question).to.eql(questions[0]);
        expect(answers).to.eql({});
        this.run = _.noop;
        done();
      });

      inquirer.prompt(questions, _.noop);
    });

    it("overwrite default prompt types", function (done) {
      var questions = [{type: "confirm", message: "something"}];
      inquirer.registerPrompt("confirm", function () {
        this.run = _.noop;
        done();
      });

      inquirer.prompt(questions, _.noop);
      inquirer.restoreDefaultPrompts();
    });
  });

  describe("#restoreDefaultPrompts()", function () {
    it("restore default prompts", function () {
      var ConfirmPrompt = inquirer.prompt.prompts.confirm;
      inquirer.registerPrompt("confirm", _.noop);
      inquirer.restoreDefaultPrompts();
      expect(ConfirmPrompt).to.equal(inquirer.prompt.prompts.confirm);
    });
  });

  // see: https://github.com/SBoudrias/Inquirer.js/pull/326
  it('does not throw exception if cli-width reports width of 0', function (done) {
    var original = process.stdout.getWindowSize;
    process.stdout.getWindowSize = function () {
      return [0];
    };
    var prompt = inquirer.createPromptModule();

    var prompts = [{
      type: "confirm",
      name: "q1",
      message: "message"
    }];

    var promise = prompt(prompts, function (err, answers) {
      process.stdout.getWindowSize = original;
      expect(answers.q1).to.equal(true);
      done();
    });

    promise.ui.rl.emit("line");
  });
});
