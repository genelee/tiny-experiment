# tiny-experiment

A lightweight utility to run split tests in your javascript application.

To-do list:
Allow traffic allocation by percentage


# Quick start

1) Install
```
npm install tiny-experiment --save
```

2) Require module
```
import tinyManager from 'tiny-experiment';
window.tinyManager = tinyManager;

// or es5

window.tinyManager = require('tiny-experiment').default;

```

3) Register experiments once
```
tinyManager.setup({
  experiments: [
    {
      experimentKey(required): 'homepageButtonStyle', // unique key
      experimentName(required): 'Homepage button style', // descriptive name for analytics
      variantNames(required): ['blue', 'red'],
      cached(optional): Boolean // default false, if true user will see same variant next time
      cachePeriod(optional): Number // default 7, if cached user will see same variant for X days
    },
    {
      // experiment two
    }
  ]
})
```

4a) Then run an experiment with variant-specific handlers
```
var experiment = tinyManager.getExperiment('homepageButtonStyle')

experiment
.on('blue', function() {
  // make button blue
})
.on('red', function() {
  // make button red
})
.run()
```

4b) You can 'run' the experiment asynchronously
```
experiment
.on('blue', function() { ... })

someAsyncFunction(function() {
  experiment.run()
})
```

# Customize completion handling

On experiment conclusion, a segment analytics call is made with event name 'Experiment Viewed', and the properties: experimentName, variantName, variantInt, and variantNames. To customize the default:

```
import tinyManager from 'tiny-experiment';
tinyManager.init({
  experiments: [ ...experiments... ],
  globalCompletionHandler: function(params) {
    // do something where argument, params, has keys: experimentName, variantName, variantInt, and variantNames
  }
})
```

# Manual variant setting

```
http://domain.com/?experimentKey=homepageButtonStyle&variantName=blue
```

This will run the experiment with experimentKey = homepageButtonStyle, and manually set the variant as 'blue'

# Angular 

a directive that let's you hide/show elements without writing any javascript: https://github.com/genelee/angular-experiment
