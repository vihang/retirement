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
      "inflation" : 2,
      "includeSS" : 1
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
    getInitialRetirementIncome: function(){
      return this.getFinalIncome() * (this.get("incomeRequired")/100);
    },
    //we need to plot not only the growing balance, but the balance once withdrawals start
    getFullRetirementBalances: function(){
      var retirementBalance = this.getRetirementTotal();
      var retirementIncome = this.getInitialRetirementIncome();
      //increase based on rate after
      //then minus retirementIncome
      var retirementTotal = _.clone(retirementBalance).reverse()[0];

      for(var i = 0; i < (110 - this.get("retirementAge")); i++) {
        retirementTotal *= (1 + this.get("rateAfter")/100);
        retirementTotal -= retirementIncome;
        retirementIncome *= (1 + this.get("inflation")/100);
        retirementTotal = (retirementTotal < 0) ? 0 : retirementTotal;
        retirementBalance.push(retirementTotal);
      }
      return retirementBalance;
    },
    getSocialSecurity: function(){
      //need to derive ss amount;
      //TODO get the age of retirement. if under 66, 75%
      var socialSecurity = 0;
      var currentYearMax = 117000;
      var monthlyAverage;

      if(this.getFinalIncome() >= currentYearMax) {
        monthlyAverage = currentYearMax/12;
        // 90% of first 826
        // 32% of 826 through 4980
        // 15% above 4980
        monthlyAverage -= 5806;
        monthlyAverage *= 0.15;
        monthlyAverage += (5806 * 0.32);
        monthlyAverage += (826 * 0.9);
        socialSecurity = monthlyAverage;
      }
      if(this.get("includeSS") == 0) {
        socialSecurity = 0;
      }
       console.log(this.data);
      //if they retire before 66, they only get 75%
      if(this.get("retirementAge") < 66) {
        socialSecurity *= 0.75;
      }

      return socialSecurity * 12;
    }
  }
  return constructor;
})();

//retirement calculator class
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
          pointDot: false,
          scaleShowVerticalLines: false,
          showTooltips: false,
          animation: true
      };
      var data = {
        labels:[],
        datasets: [
          {
            label: "Social Security",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: []
          },
          {
            label: "Retirement Savings",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: []
          },
          {
            label: "Goal Income",
            fillColor: "rgba(175,235,139,0.2)",
            strokeColor: "rgba(175,235,139,1)",
            pointColor: "rgba(175,235,139,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(175,235,139,1)",
            data: []
          }
        ]
      }
      
      this.generateLineChart(data, options);

      var self = this;
      //for each item in our Line Chart Data, update our line chart object
      _.each(this.getLineChartData(), function(row){
        self.lineChart.addData([row.ss, row.balance, row.goal], row.age);
      });
    },
    getLineChartData: function(){
      var lineChartData = [];
      var age = this.userData.get("currentAge");
      var retirementAmounts = this.userData.getFullRetirementBalances();
      var self = this;
      var ageLabel;
      var goalIncome = 0;
      var socialSecurity = 0;


      _(retirementAmounts).forEach(function(n){
        ageLabel = (age%5 === 0) ? ("age: " + age) : "";

        //As soon as they are retirement age, we want to record their desired income
        if(age === self.userData.get("retirementAge")) {
          goalIncome = self.userData.getInitialRetirementIncome();
        }
        //adjust the desired income for inflation
        goalIncome *= (1 + self.userData.get("inflation")/100);

        if(age < toFloat(self.userData.get("retirementAge"))) {
          socialSecurity = 0;
        } else if(age === self.userData.get("retirementAge")) {
          socialSecurity = self.userData.getSocialSecurity();
        }

        if(age%2 === 0) {
          lineChartData.push({
            //figure out SSN rate
            ss: Math.round(socialSecurity),
            balance: Math.round(n + socialSecurity),
            goal: Math.round(goalIncome),
            age: ageLabel
          });
        }
        
        socialSecurity *= (1 + self.userData.get("inflation")/100);
        age++;
      }).value();//end forEach
      return lineChartData;
    },
    updateLineChart: function(){
      this.lineChart.options.animationSteps = 30;
      row = this.getLineChartData();
      for(var i=0; i < row.length; i++){
        this.lineChart.datasets[0].points[i].value = row[i].ss;
        this.lineChart.datasets[1].points[i].value = row[i].balance;
        this.lineChart.datasets[2].points[i].value = row[i].goal;
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

function isThereAChange(userData) {
  var types = ["currentAge",
      "retirementAge",
      "annualIncome",
      "retirementSavings",
      "currentRetirement",
      "expectedIncrease",
      "incomeRequired",
      "rateBefore",
      "rateAfter",
      "inflation",
      "includeSS"
    ]
  return _.any(types, function(type) {
    return toFloat(document.retirementInputs[type].value) !== userData.get(type);
  });
}

//set the data in our userData object to match the form values
function updateUserData(userData, field) {
  userData.set(field, toFloat(document.retirementInputs[field].value));
}

function toFloat(element) {
  //we divide by 1 to ensure that it is a number
  //otherwise, it returns NaN
  return element/1;
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

//if they enter invalid information, reset it ot the default values
function resetFormValues(userData, field) {
  var val = document.retirementInputs[field].value;

  if(!userData.isNumeric(val)) {
    document.retirementInputs[field].value = userData.defaults[field];
    $('#alertText').removeClass('hidden');
  }
  else {
    $('#alertText').addClass('hidden');
  }
}

function fillForm(userData) {
  $("#retirementAmount").text(moneyFormat(userData.getRetirementTotal().reverse()[0]));
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

  $(":input").blur(function(element){
    if(isThereAChange(userData)){
      resetFormValues(userData, element.currentTarget.attributes.name.nodeValue);
      updateUserData(userData, element.currentTarget.attributes.name.nodeValue);
      fillForm(userData);
      rc.updateLineChart();
    }
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



