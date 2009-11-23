/*
 * Rhino compatible Javascript Test Runner using YUI3 Test Framework
 * @author <a href="mailto:fiann.ohagan@jshub.org">Fiann O'Hagan</a>
 * @author <a href="mailto:liam.clancy@jshub.org">Liam Clancy</a>
 */

(function(args) {
  
  // HTML file that will create a DOM for these tests
  var test_file = args[0];
  if (typeof test_file != 'string') {
    throw new java.lang.IllegalArgumentException("You must specify a HTML test file on the command line");
  }

  // Logging on/off
  var log_level = (args[1] === 'true');
  if (log_level) {
    print("javascript_test_runner.js: Using 'debug' mode");
  }

  // Paths and vars
  var reports_path = "test/reports/";
  var url_path = "/test/unit/";
  
  // get the path/name of the test file e.g. image_transport/api_test
  var test_file_name = test_file.substring(test_file.lastIndexOf(url_path) + url_path.length);

  /**
   * Utility functions
   */     
  // initialize a console for logging, taking into account debug setting
  var console = new function() {
    var indent = "";
    var format = function(msg) {
      if (typeof msg === 'string') {
        for (var i = 1; i < arguments.length; i++) {
          var entity = arguments[i];
          if (typeof entity == 'object') {
            if (entity.toString !== Object.prototype.toString) {
              entity = entity.toString();
            } else {
              // use toString() functions where available for DOMNodes and other
              // big objects
              var clone = {};
              for (var field in entity) {
                if (entity[field] == null || !entity[field].toString) {
                  clone[field] = entity[field];
                } else if (typeof entity[field] == 'function' ||
                entity[field].toString !== Object.prototype.toString) {
                  clone[field] = entity[field].toString();
                } else {
                  clone[field] = entity[field].toSource();
                }
              }
              entity = clone.toSource();
            }
          }
          if (msg.indexOf('%s') > -1) {
            msg = msg.replace('%s', entity);
          } else {
            msg += ", " + entity;
          }
        }
      }
      return msg;
    }
    // called when debug = false and does nothing with the message
    var discard = function() {};
    this.info = (!log_level) ? discard :  function() {
      print("info: " + indent + format.apply(this, arguments));
    };
    this.log = (!log_level) ? discard : function() {
      print("log: " + indent + format.apply(this, arguments));
    };
    this.warn = (!log_level) ? discard : function() {
      print("warn: " + indent + format.apply(this, arguments));
    };
    this.error = (!log_level) ? discard : function() {
      print("error: " + indent + format.apply(this, arguments));
    };
    this.debug = (!log_level) ? discard : function() {
      print("debug: " + indent + format.apply(this, arguments));
    };
    // adds a '+ ' visual prefix to nest log messages
    this.group = (!log_level) ? discard : function() {
      indent += "+ ";
      print("log: " + indent + format.apply(this, arguments));
    };
    this.groupEnd = (!log_level) ? discard : function() {
      indent = indent.substring(0, indent.length - 2);
    };
  };
  
  // Event handlers and methods
  var utils = {

    /**
     * TEST_PASS_EVENT, TEST_FAIL_EVENT, TEST_IGNORE_EVENT event handlers
     * that logs a result to the console dependent on its type.
     * @method reportResult
     * @param {Object} result
     * @private
     */
    reportResult: function(result) {
      if (result.type == 'fail') {
        console.error("Test '" + result.testName + "' failed.");
        console.error("Message: " + result.error);
      }
    },

    /**
     * COMPLETE_EVENT event handler
     * that outputs the report and log as files.
     * @method reportCompletionStatus
     * @param {Object} evt
     * @private
     */
    reportCompletionStatus: function(evt) {
      try {
        utils.printReport(evt);
        utils.saveJUnitTestReport(evt);
        utils.saveYUITestReport(evt);

        // exit status is 0 if no failures, otherwise the Ruby Test Runner captures a fail, e.g. ..F. in the output
        quit(evt.results.failed);
      } 
      catch (e) {
        // log any errors raised by the file saves
        console.error(e);
        for (prop in e) {
          console.error("Rhino: " + prop + "=" + e[prop]);
        }
        // return non-zero so the Ruby Test Runner sees this as a fail
        quit(1);
      }
    },
    
    // A crafted results object that represents a YUI Test fail for an HTML
    // file that could not be parsed.
    manualResultsObject: function(message, e, test_file_name, test_file) {
      var results = {
        type: "report",
        total: 1,
        timestamp: (new Date()).toGMTString(),
        passed: 0,
        failed: 1,
        duration: 0,
        name: "YUI Test Results"
      };
      results[test_file] = {
        'Parse HTML test file': {
          'test env.js can read unit test HTML file': {
            message: message,
            type: "test",
            name: "test env.js can read unit test HTML file",
            result: "fail",
            error: e
          },
          total: 1,
          passed: 0,
          failed: 1,
          type: "testcase",
          name: test_file_name + ": Parse HTML test file"
        },
        total: 1,
        passed: 0,
        failed: 1,
        type: "testsuite",
        name: test_file
      };
      return results;
    },

    /**
     * Print output to console (ignores debug setting)
     * @param {Object} data the event that was recorded
     * @param {Number} timeTaken of milliseconds from the start of the test
     */
    printReport: function(data) {
      var timeTaken = (+new Date()) - startTime;    
      print('\nUnit Test Report: ' + data.results.passed + " Passed, " 
	    + data.results.failed + " Failed, " 
		  + data.results.ignored + " Ignored, " 
		  + data.results.total + " Total tests in " + timeTaken + "ms"
		  + ' for '+ test_file_name);
    },  
    
    // Output data in YUI JSON format to a file for debugging
    saveYUITestReport: function(data) {
      if (!data){
        console.log("No YUI Test results collected")
        return
      }
      // Pretty print the JSON for reports
      var jsonStr = "";
      try {
        jsonStr = Y.JSON.stringify(data.results,null,2);
      } catch (e) {
        console.error("json: Invalid or cyclical reference in JSON object")
      }

      // save the file
      var path = reports_path + 'YUITEST-' + test_file_name.replace(/\//g, '_') + '.json';	    
      var out = new java.io.FileWriter(new java.io.File(path));
      out.write(jsonStr);
      out.flush();
      out.close();
      console.log('Report saved in YUITest JSON at ' + path);
    },
     
    // Save data in JUnit XML format for Hudson reporting
    // ref: http://developer.yahoo.com/yui/3/test/#test-reporting
    saveJUnitTestReport: function(data) {
      if (!data){
        console.log("No YUI Test results collected")
        return
      }
      // Use YUI3 Test built in JUnitXML formatter
      var xml = Y.Test.Format.JUnitXML(data.results);

      // where to save (relative to #{RAILS_ROOT}) - this dir is automatically created by CI::Reporter and read by Hudson
      var path = reports_path + 'TEST-' + test_file_name.replace(/\//g, '_') + '.xml';
      // save as file
      var out = new java.io.FileWriter(new java.io.File(path));      
      out.write(xml);
      out.flush();
      out.close();
      console.log('Report saved in JUnit XML at ' + path);
    }
  };  

  // Env.js creates a browser environment, including a 'window' object
  // ref: http://github.com/thatcher/env-js
  console.info("Loading Env.js: started");
  load("vendor/plugins/jshub_javascript_tester/lib/env/env.rhino.js");
  console.info("Loading Env.js: finished");

  // use the console for output from the HTML page
  window.console = console;  
  
  /*
   * Load the HTML page with the Unit Tests in, catching any errors so we can write a JUnit report if env.js can't read the HTML file
   */
  try {  
    // Load HTML page into the env.js 'browser'
    console.info("Loading HTML test file: " + test_file);
    // Init Envjs ref: http://env-js.appspot.com/doc/api-1.0.x
    Envjs(test_file, {
      logLevel: Envjs.ERROR, // Envjs specific logLevel: DEBUG, INFO, WARN, ERROR, NONE
      scriptTypes: { "text/javascript": true }
    });
    console.info("File name: " + test_file_name);
  } catch (e) {	  
    var message = e.toString();
	  if (e.fileName) {
	  	message += ", file: " + e.fileName;
	  }
	  if (e.code) {
	  	// it's probably a DOMException
	  	message += " parsing the HTML file";
	  }
    print("Errors loading the HTML test file: " + test_file +"\n" + message);
    // Manually construct a YUI Test JSON results object to represent the failure
    var results = utils.manualResultsObject(message, e, test_file_name, test_file);
    // save this error as a JUnit report
    utils.saveJUnitTestReport(results);
    // return non-zero so the Ruby Test Runner sees this as a fail
    quit(1);
  }

  if (navigator.userAgent.match(/Rhino/)){  
    console.info("Browser UA: " + navigator.userAgent)  
    console.info("Browser UA: " + Y.JSON.stringify(Y.UA,null,2))

    // time how long it takes to run
    var startTime = 0;

    // initialise test runner
    var TestRunner = Y.Test.Runner;
    // capture results
    TestRunner.subscribe(TestRunner.BEGIN_EVENT, function() {
      startTime = +new Date();
      console.info("Test execution started");
    });
    TestRunner.subscribe(TestRunner.TEST_PASS_EVENT, utils.reportResult);
    TestRunner.subscribe(TestRunner.TEST_FAIL_EVENT, utils.reportResult);
    TestRunner.subscribe(TestRunner.TEST_IGNORE_EVENT, utils.reportResult);
    TestRunner.subscribe(TestRunner.COMPLETE_EVENT, utils.reportCompletionStatus);    
    console.info("Rhino: YUI TestRunner events subscribed");
  
    // clear any old tests from previous pages
    TestRunner.clear();
    // add the test cases and suites from the loaded HTML file
    console.log("Rhino: Running tests " + Y.JSON.stringify(suite,null,2))
    TestRunner.add(suite);    
    // run all tests
    TestRunner.run();
    console.log("Rhino: TestRunner complete");
  }

  // Stop and allow window events to be handled, e.g. YUI Test Runner subscribers
  Envjs.wait();

})(arguments);
