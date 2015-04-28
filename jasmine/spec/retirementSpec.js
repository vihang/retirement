describe("UserData", function() {
  var data;
  var retirementCalc;

  beforeEach(function() { 
    data = new UserData();
    retirementCalc = new RetirementCalc(
      $("#lineChart").get(0).getContext("2d"),
      data
    );
    mortgagePlaceHolder = jasmine.createSpyObj('mortgageCalc', ['updatePieChart', 'definePieChart']);
  }); 

  describe("#get", function(){
    it("should return the default value if no number is provided", function(){
      data.set("intRate", "test");
      expect(data.get("intRate")).toEqual(4);
    });
  });

  describe("#isNumeric", function(){
    describe("when the value is not a number", function(){
      it("returns false", function(){
        expect(data.isNumeric("test")).not.toBe(true);
      });
    });
    describe("when the value is a number", function(){
      it("returns true", function(){
        expect(data.isNumeric(4)).toBe(true);
      });
    })
  });
});


//MortgageCalc class
describe("RetirementCalc", function() {
  var data;
  var retirementCalc;

  beforeEach(function() { 
    data = new UserData();
    retirementCalc = new RetirementCalc(
      $("#lineChart").get(0).getContext("2d"),
      data
    );
  }); 

  describe("#defineLineChart", function(){
    it("should call generateLineChart", function(){
      spyOn(retirementCalc, "generateLineChart");
      spyOn(_, "each").and.callFake(function(){
        return;
      });
      retirementCalc.defineLineChart();
      expect(retirementCalc.generateLineChart).toHaveBeenCalled();
    });
  });

  describe("#getLineChartData", function(){
    beforeEach(function(){
      data.set("mortgageAmount", 200000);
      data.set("intRate", 4);
      spyOn(data, "getPrincipalInterest").and.returnValue(1295);
    });
  });
}); 

describe("Form Methods", function() {
  var data;
  var retirementCalc;

  beforeEach(function() { 
    data = new UserData();
    retirementCalc = new RetirementCalc(
      $("#lineChart").get(0).getContext("2d"),
      data
    );
  });


  describe("#fillValues", function(){
    var userData;
    var defaults;
    beforeEach(function() {
      userData = new UserData();
      spyOn(userData, 'set');
      defaults = {
        "interest" : '4',
        "annualIncome" : '50000',
        "monthlyPayment" : '1500',
        "downPayment" : '10000',
        "propertyTaxes" : '1.2',
        "homeInsurance" : '800',
        "hoaFees" : '0',
        "monthlyDebt" : '0',
        "loanTerm" : '360'
      };
    });
  });


  describe("#moneyFormat", function(){
    describe("when the value is not negative", function(){
      describe("when the value is less than 3 characters", function(){
        it("returns a formatted string with commas", function(){
          var testValue = 1234567;
          expect(moneyFormat(testValue)).toEqual("$1,234,567");
        });
      });
      describe("when the value is more than 3 characters", function(){
        it("returns a formatted string without commas", function(){
          var testValue = 123;
          expect(moneyFormat(testValue)).toEqual("$123");
        });
      });

      
    });
    describe("when the value is negative", function(){
      it("returns $0", function(){
        var testValue = -123;
        expect(moneyFormat(testValue)).toEqual("$0");
      });
    });
  });
});

