//Our user data class
var UserData = (function(){
  var constructor = function(){
    this.defaults = {
      "currentAge" : 30,
      "retirementAge" : 67,
      "annualIncome" : 70000,
      "retirementSavings" : 15,
      "currentRetirement" : 0,
      "expectedIncrease": 2,
      "incomeRequired" : 85,
      "rateBefore" : 7,
      "rateAfter" : 4,
      "inflation" : 2
    };
    this.data = _.clone(this.defaults);
  };
//set data
  constructor.prototype = {
    set: function(key, value) {
      this.data[key] = this.isNumeric(value) ? value : this.defaults[key];
    },
    get: function(key) {
      return this.data[key];
    },
    //is this a number?
    isNumeric: function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },
    //record each years income based on the estimate income increase
    getAnnualIncome: function(){
      var yearsTilRetire = this.get("retirementAge") - this.get("currentAge");
      var annualIncomeArray = [];
      var income = this.get("annualIncome");
      for(var i = 0; i < yearsTilRetire; i++) {
        income *= 1 + this.get("expectedIncrease")/100;
        annualIncomeArray.push(income);
      }
      return annualIncomeArray;
    },
    //get the contributions made each year from each increase
    getAnnualContributions: function(){
      var annualContributions = [];
      var self = this;
      _(this.getAnnualIncome()).forEach(function(n){
        annualContributions.push(n * (self.get("retirementSavings")/100));
      }).value();
      return annualContributions;
    },
    //get the total cost of our retirement, compounded annually
    getRetirementTotal: function() {
      var retirement = this.get("currentRetirement");
      var plotPoints = [];
      var self = this;
      _(this.getAnnualContributions()).forEach(function(contribution){
        //increase based on rate before retirement
        retirement += contribution;
        retirement *= 1 + (self.get("rateBefore")/100);
        //create an array with our growing balance for the line chart
        plotPoints.push(retirement);
      }).value();
      return plotPoints;
    },
    //how much were they making at the end?
    getFinalIncome: function() {
      return _.clone(this.getAnnualIncome()).reverse()[0];
    },
    //we need to plot not only the growing balance, but the balance once withdrawals start
    getFullRetirementBalances: function(){
      var retirementBalance = this.getRetirementTotal();
      var retirementIncome = this.getFinalIncome() * (this.get("incomeRequired")/100);
      //increase based on rate after
      //then minus retirementIncome
      var retirementTotal = _.clone(retirementBalance).reverse()[0];

      for(var i = 0; i < 35; i++) {
        retirementTotal *= (1 + this.get("rateAfter")/100);
        retirementTotal -= retirementIncome;
        retirementIncome *= (1 + this.get("inflation")/100);
        retirementTotal = (retirementTotal < 0) ? 0 : retirementTotal;
        retirementBalance.push(retirementTotal);
      }
      return retirementBalance;
    },
    getSocialSecurity: function(){
      //need to derived ss amount;
      var socialSecurity = 0;
      return socialSecurity;
    }
  }
  return constructor;
})();

var RetirementCalc = (function() {
  var constructor = function(lineChart, userData) {
    this.lineChart = lineChart;
    this.userData = userData;
  };

  constructor.prototype = {
    generateLineChart: function(data, options){
      this.lineChart = new Chart(this.lineChart).Line(data, options);
    },
    updateUserData: function(userData){
      this.userData = userData;
    },

    defineLineChart: function(){
      var options = {
          //Boolean - Whether to fill the dataset with a colour
          datasetFill : true,
          animationSteps: 1,
          pointDot: false
      };
      var data = {
        labels:[],
        datasets: [
          // {
          //   label: "Goal income",
          //   fillColor: "rgba(220,220,220,0.2)",
          //   strokeColor: "rgba(220,220,220,1)",
          //   pointColor: "rgba(220,220,220,1)",
          //   pointStrokeColor: "#fff",
          //   pointHighlightFill: "#fff",
          //   pointHighlightStroke: "rgba(220,220,220,1)",
          //   data: []
          // },
          {
            label: "Retirement Savings",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: []
          }//,
          // {
          //   label: "Amount withdrawn",
          //   fillColor: "rgba(175,235,139,0.2)",
          //   strokeColor: "rgba(175,235,139,1)",
          //   pointColor: "rgba(175,235,139,1)",
          //   pointStrokeColor: "#fff",
          //   pointHighlightFill: "#fff",
          //   pointHighlightStroke: "rgba(175,235,139,1)",
          //   data: []
          // }
        ]
      }
      
      this.generateLineChart(data, options);

      var self = this;
      //for each item in our Line Chart Data, update our line chart object
      _.each(this.getLineChartData(), function(row){
        self.lineChart.addData([row.balance], row.age);
      });
    },
    getLineChartData: function(){
      var lineChartData = [];
      var age = this.userData.get("currentAge");
      var retirementAmounts = this.userData.getFullRetirementBalances();
      var self = this;

      _(retirementAmounts).forEach(function(n){
        lineChartData.push({
          //multiply SSN times inflation rate???
          balance: Math.round((n - (self.userData.getSocialSecurity() * self.userData.get("inflation")/100))),
          age: "age: " + age
        });
        age++;
      }).value();//end forEach

      console.log(lineChartData);
      return lineChartData;
    },
    updateLineChart: function(){
      this.lineChart.options.animationSteps = 30;
      row = this.getLineChartData();
      for(var i=0; i < row.length; i++){
        this.lineChart.datasets[0].points[i].value = row[i].conservativePayment;
        this.lineChart.datasets[1].points[i].value = row[i].standardPayment;
        this.lineChart.datasets[2].points[i].value = row[i].aggressivePayment;
        this.lineChart.update();
      }
    }
  }
  return constructor;
})();

//our initialization
//set some default values and match those values to our user data
function initialize(userData, rc) {

  _.each(userData.defaults, function(key, val){
    document.retirementInputs[val].value = userData.defaults[val];
  });

  //rc.defineLineChart();
}

//set our values to string and add commas and a dollar sign
function moneyFormat(s) {
  s = String(Math.floor(s));
  //reset to 0 if the number is negative
  if(s.indexOf("-") == 0) {
    s = "$0";    
  } else {
    for (var i = s.length - 3; i > 0; i -= 3) {
      s = s.slice(0, i) + ',' + s.slice(i);      
    }
    s = "$" + s;
  }
  return s;
}

function resetFormValues(userData) {
  var alertText = false;
  if(!userData.isNumeric(document.retirementInputs.intRate.value)) {
    document.retirementInputs.intRate.value = 4;
    alertText = true; 
  }
  if(!userData.isNumeric(document.retirementInputs.mortgageAmount.value)){
    document.retirementInputs.mortgageAmount.value = 200000; 
    alertText = true;    
  }
  //add the alert text to the bottom of our form
  if(alertText) {
    $('#alertText').removeClass('hidden');
  } else {
    $('#alertText').addClass('hidden');
  }
}

//once our page is loaded
$(document).ready(function() {
  //our user's data
  var userData = new UserData();
  //instantiate our mortgage calculator
  var rc = new RetirementCalc(
    $("#lineChart").get(0).getContext("2d"),
    userData
  );
  initialize(userData, rc);

  rc.defineLineChart();

  $(":input").blur(function(){

  });
});


/* TODO

I'd like to change the graph a bit.  They have one line of the graph labelled "total expenses" but what it actually shows is the amount of retirement account withdrawals to meet income needed.  
It would be nice to replace that line with an "income target" line which would graph the income target year-by-year based on the %income replacement they provided, and add a "income actual" 
line which shows the income possible from retirement savings withdrawals and social security...so if they run out of retirement savings they would still have some income from social security 
and they could see the gap between target and actual income projected.  
We should also add some info to help them think about what their income need might be in retirement; how expenses change and what is a reasonable/typical income replacement % to plan with.


if after 2037 75% SS

SS calc =
90% of first 826
32% of 826 through 4980
15% above 4980
*/



