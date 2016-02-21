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
        if(i > 0) {
          income *= (1 + (this.get("expectedIncrease")/100));
        }
        annualIncomeArray.push(income);
      }
      return annualIncomeArray;
    },
    //get the contributions made each year from each increase
    getAnnualContributions: function(){
      var annualContributions = [];
      var self = this;
      var age = this.get("currentAge");

      _(this.getAnnualIncome()).forEach(function(n){
        annualContributions.push(n * (self.get("retirementSavings")/100));
        age++;
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
        retirement *= (1 + (self.get("rateBefore")/100));
        retirement += contribution;
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
      var retirementTotal = _.clone(retirementBalance).reverse()[0];
      var age = this.get("currentAge");
      var year = new Date().getFullYear();
      var socialSecurity = this.getSocialSecurity();;

      for(var i = 0; i < (110 - this.get("retirementAge")); i++) {

        //social security shoul dbe 75% of normal value if after the year 2037
        if(i ===0 && year > 2037) {
          socialSecurity *= 0.75;
        }

        retirementTotal *= (1 + this.get("rateAfter")/100);
        retirementTotal -= (retirementIncome - socialSecurity);
        retirementIncome *= (1 + this.get("inflation")/100);
        retirementTotal = (retirementTotal < 0) ? 0 : retirementTotal;
        retirementBalance.push(retirementTotal);

        //increase social security by inflation
        socialSecurity *= (1 + this.get("inflation")/100);

        age++;
        year++;
      }
      return retirementBalance;
    },
    getSocialSecurity: function(){
      //need to derive ss amount;
      //TODO get the age of retirement. if under 66, 75%
      var socialSecurity = 0;
      var currentYearMax = 117000;
      var finalIncome = this.getFinalIncome();
      var monthlyAverage;

      if(finalIncome >= currentYearMax) {
        monthlyAverage = currentYearMax/12;
      } else {
        monthlyAverage = finalIncome/12;
      }

      //if the monthly average is less than 4980, take 32% of 826 less the total
      if(monthlyAverage < 4980) {
        monthlyAverage -= 826;
        monthlyAverage *= 0.32;
      } else {
        monthlyAverage -= 4980;
        monthlyAverage *= 0.15;
        monthlyAverage += ((4980 - 826) * 0.32);
      }
      monthlyAverage += (826 * 0.9);
      monthlyAverage = (monthlyAverage < 0) ? 0 : monthlyAverage;
      socialSecurity = monthlyAverage * 12;
      //if we don't want to include SS on our chart
      if(this.get("includeSS") == 0) {
        socialSecurity = 0;
      }
      //if they retire before 66, they only get 75%
      if(this.get("retirementAge") < 66) {
        socialSecurity *= 0.75;
      }
      return socialSecurity;
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
          scaleLabel: "<%= moneyFormat(value) %>",
          animation: true
      };
      var data = {
        labels:[],
        datasets: [
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
        self.lineChart.addData([row.balance, row.goal], row.age);
      });
    },
    removeLineChartData: function(){
      
      var self = this;
      this.lineChart.options.animationSteps = 1;

      //remove the data from the previous query
      var targetLength = this.lineChart.datasets[0].points.length;

      for(var i = 0; i < targetLength;i++){
         self.lineChart.removeData();
      }
      _.each(this.getLineChartData(), function(row){
        self.lineChart.addData([row.balance, row.goal], row.age);
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
      var retireAgeCheck = true;

      _(retirementAmounts).forEach(function(n){
        ageLabel = (age%5 === 0) ? ("age: " + age) : "";

        //As soon as they are retirement age, we want to record their desired income
        if(age === self.userData.get("retirementAge")) {
          goalIncome = self.userData.getInitialRetirementIncome();
        }
        //adjust the desired income for inflation
        goalIncome *= (1 + self.userData.get("inflation")/100);

        //control how often we plot our data.  Doing it every year slows down the animation
        if(age%2 === 0) {
          lineChartData.push({
            //figure out SSN rate
            balance: Math.round(n),
            goal: Math.round(goalIncome),
            age: ageLabel
          });
        }
        //if the balance falls to 0, post the age the funds run out
        if(n <= 0 && retireAgeCheck) {
          fillRetireAge(age);
          //we have to use a boolean, otherwise it would trigger multiple times
          retireAgeCheck = false;
        }
        age++;
      }).value();//end forEach
      return lineChartData;
    },
    updateLineChart: function(){
      if(typeof this.lineChart.datasets[0].points[0] === 'undefined'){
        this.defineLineChart(); 
      } else {
        this.lineChart.options.animationSteps = 30;
        row = this.getLineChartData();
        for(var i=0; i < row.length; i++){
          this.lineChart.datasets[0].points[i].value = row[i].balance;
          this.lineChart.datasets[1].points[i].value = row[i].goal;
          this.lineChart.update();
        }
      }
    }
  }
  return constructor;
})();

//our initialization
//set some default values and match those values to our user data
function initialize(userData, rc) {

  _.each(userData.defaults, function(key, val){
    userData.data[val] = GetUrlParam(val) || userData.defaults[val]
    document.retirementInputs[val].value = userData.data[val];
    if($(retirementInputs[val]).hasClass('percent')) {
      document.retirementInputs[val].value = document.retirementInputs[val].value + "%";
    }
  });

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
  logicCheck(userData);
}

function toFloat(element) {
  //we divide by 1 to ensure that it is a number
  //otherwise, it returns NaN
  return element/1;
}

//we need to check certain logic to make sure invalid numbers aren't input
function logicCheck(userData) {
  if(document.retirementInputs.currentAge.value > userData.get("retirementAge")) {
    document.retirementInputs.currentAge.value = userData.get("retirementAge");
  }
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
  $("#incomeAtRetirement").text(moneyFormat(userData.getFinalIncome()));
  $("#incomeAfterRetirement").text(moneyFormat(userData.getInitialRetirementIncome()));
  $("#initialSS").text(moneyFormat(userData.getSocialSecurity()));
}

function fillRetireAge(age) {
  $("#retireAge").text(age);
}

function appendPercent(element) {
  $(element).val($(element).val() + "%");
}

function GetUrlParam(name) { 
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results && results.length>0) return results[1] || 0;
  return null
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
  fillForm(userData);

  rc.defineLineChart();

  $(".percent").click(function(element){
    $(element.currentTarget).val($(element.currentTarget).val().slice(0, -1));
  }).blur(function(element){
    appendPercent(element.currentTarget);
  });

  //if they make a change to their age, we need to adjust the axis of the chart
  $(":input").change(function(element){
    var checkToUpdate = true;
    //if the element is a percent field and has a percent sign already, remove it
    if(element.currentTarget.className === "percent" && element.currentTarget.value.slice(-1) === "%") {
      $(element.currentTarget).val($(element.currentTarget).val().slice(0, -1));
    }

    if(element.currentTarget.attributes.name.nodeValue == 'currentAge') {
      //we need to update the data for current age before we recalculate
      updateUserData(userData, element.currentTarget.attributes.name.nodeValue);
      rc.removeLineChartData();
      checkToUpdate = false;
    }

    //the axis is uneffected by other fields
    if(isThereAChange(userData)){
      resetFormValues(userData, element.currentTarget.attributes.name.nodeValue);
      updateUserData(userData, element.currentTarget.attributes.name.nodeValue);
      fillForm(userData);

      //if the current age field was changed, then don't update the chart
      //since resetting the data does that for us
      if(checkToUpdate){
        rc.updateLineChart();
      }
    }
  });
});




