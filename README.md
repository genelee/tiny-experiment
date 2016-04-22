# angular-experiment
A lightweight javascript module to run a/b tests on angular. Primarily made to avoid mounting costs of services like Optimizely.

Dependencies:
'angular',

'angular-cookies',

'angular-cookie'

To-do list:
Allow different options to track experiment results (currently done with segment)

Remove dependencies on 'ipCookie'

Allow traffic allocation by percentage


Use it like this in your JS:


First, register the experiment
```
angular.module('foo').run(['$experiment', function($experiment) {
  $experiment.setExperiment('myExperiment', { //used to reference within your code
    active: true, 
    //dynamically switch off to prevent experiment from running
    
    experimentName: 'My experiment', 
    //only used in analytics call
    
    variantNames: ['variantA', 'variantB', 'variantC'], 
    //randomly chooses one
    
    cached: true 
    //sets cookie for experiment key and variant for recurring visits to experiment
  })
}]
```

Then, register handlers for variants before or after running the Experiment object method 'run'
```
angular.module('foo')
.controller('ApplicationController' ['$scope', '$experiment', function($scope, $experiment) {
  var experiment = $experiment.getExperiment('myExperiment')
  
  experiment
  .on('variantA', function() {
    // do something
  })
  .on('variantB', function() {
    // do something else
  })
  .run()
  
  $scope.$on('SOME_ASYNC_EVENT', function() {
    experiment.on('variantC', function() {
      // if this variant is selected, handler will be executed even after experiment has been 'run'
    })
  })
}])
```

Or in the template with the pb-experiment directive:

```
<div pb-experiment key="myExperiment" variant="variantA" default-variant="true">
  THIS IS VARIANT A
</div>

<div pb-experiment key="myExperiment" variant="variantB">
  THIS IS VARIANT B
</div>
```

If no active experiment is found with these parameters, defaultVariant = true will prevent element from being hidden
