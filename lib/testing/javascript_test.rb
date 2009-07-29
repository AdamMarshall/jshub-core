require 'test_helper'

class JavascriptTest < ActionController::IntegrationTest
    
  # Initialize tests on this class for each html unit test page.
  # All the tests should be in the folder RAILS_ROOT/test/unit/javascript/
  def self.initialize_tests(test_cases=[])
    log_level = ENV['JSHUB_DEBUG'] == 'true' ? true : false

    # Define a test method for each test case HTML file supplied
    test_cases.each do |test_case|
      define_method "#{test_case}" do
        execute_test(test_case)
      end
    end
  end
  
  def execute_test(test_case)
    log_level = ENV['JSHUB_DEBUG'] == 'true' ? true : false
    test_runner = "lib/testing/javascript_test_runner.js"
    reports_path = "#{APP_CONFIG[:continuous_integration][:reports_path]}"
    base_url = "#{APP_CONFIG[:continuous_integration][:base_url]}"
    # TODO we should store and refer to these tests as 'test/javascripts' like similar plugins
    test_case_url = base_url + test_case.gsub("/javascript","")

    puts "Test Case #{test_case}" if log_level
    puts "URL to Test Case #{test_case_url}" if log_level

    # Create location for outputting the reports in case ci:setup:unittest is not being used, e.g. on a developer machine
    FileUtils.mkpath "#{reports_path}"
        
    # Load the JS Test Runner and HTML file in Rhino
    rhinojs = RhinoJS.new
    assert rhinojs.run(test_runner, [test_case_url, log_level]), "At least one failure"
  end
end