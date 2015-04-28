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
      data.set("currentAge", "test");
      expect(data.get("currentAge")).toEqual(30);
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

  describe("derived methods", function(){
    //we wrap all of these in one describe block so we can use some default values
    beforeEach(function(){
      var params = {
        'retirementAge' : 33,
        'currentAge' : 30,
        "expectedIncrease": 2,
        'annualIncome' : 70000,
        "retirementSavings" : 15,
        "rateBefore" : 7,
        "incomeRequired" : 85,
        "currentRetirement" : 0
      }
      spyOn(data, 'get').and.callFake(function(dataParams){
        return parseFloat(params[dataParams]);
      });
    });
    describe("#getAnnualIncome", function(){
      it("returns 70k, 71.4k and 72828 on 3 years of data", function(){
        var testArray = [70000, 71400, 72828];
        expect(data.getAnnualIncome()).toEqual(testArray);
      });
    });
    describe("#getAnnualContributions", function(){
      it("returns 10500, 10710 and 10924.199999999999 on 3 years of data", function(){
        var testArray = [10500, 10710, 10924.199999999999];
        expect(data.getAnnualContributions()).toEqual(testArray);
      });
    });
    describe("#getRetirementTotal", function(){
      it("returns 10500, 21945 and 34405.35 on 3 years of data", function(){
        var testArray = [10500, 21945, 34405.35];
        expect(data.getRetirementTotal()).toEqual(testArray);
      });
    });
    describe("#getFinalIncome", function(){
      it("returns 72828", function(){
        expect(data.getFinalIncome()).toEqual(72828);
      });
    });
    describe("#getInitialRetirementIncome", function(){
      it("returns 61903.799999999996", function(){
        expect(data.getInitialRetirementIncome()).toEqual(61903.799999999996);
      });
    });
    describe("#getFullRetirementBalances", function(){
      it("returns an array with 80 items", function(){
        expect(data.getFullRetirementBalances().length).toEqual(80);
      });
      it("returns the same values as getRetirementTotal() for the first 3 items", function(){
        expect(data.getFullRetirementBalances().slice(0, 3)).toEqual(data.getRetirementTotal());
      });
    });
  });
});


//RetirementCalc class
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


  // describe("#fillValues", function(){
  //   var userData;
  //   var defaults;
  //   beforeEach(function() {
  //     userData = new UserData();
  //     spyOn(userData, 'set');
  //     defaults = {
  //       "currentAge" : 30,
  //       "retirementAge" : 67,
  //       "annualIncome" : 70000,
  //       "retirementSavings" : 15,
  //       "currentRetirement" : 0,
  //       "expectedIncrease": 2,
  //       "incomeRequired" : 85,
  //       "rateBefore" : 7,
  //       "rateAfter" : 4,
  //       "inflation" : 2,
  //       "includeSS" : 1
  //     };
  //   });
  // });


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

