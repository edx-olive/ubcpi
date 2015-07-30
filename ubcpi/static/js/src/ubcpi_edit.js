angular.module("ubcpi_edit", ['constants', 'ngMessages', 'ngSanitize', 'ngCookies'])

    .run(['$http', '$cookies', function ($http, $cookies) {
        // set up CSRF Token from cookie. This is needed by all post requests
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
    }])

    .directive('validateForm', ['$q', 'studioBackendService', function($q, studioBackendService) {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                scope.$watch(attrs.ngModel, function(model) {
                    if (model != null) {
                        ctrl.$validate();
                    }
                }, true);
                ctrl.$asyncValidators.validate_form = function (modelValue, viewValue) {
                    scope.piForm.$errors = {};
                    return studioBackendService.validateForm(modelValue).then(function () {
                        return true;
                    }, function (error) {
                        scope.piForm.$errors = error.error;
                        return $q.reject(error.error);
                    });
                };
            }
        };
    }])

    .factory('studioBackendService', ['$http', '$q', 'urls_edit', function ($http, $q, urls) {
        return {
            validateForm: validateForm,
            submit: studioSubmit
        };

        function validateForm(values) {
            return $http.post(urls.validate_form, values).
                then(function () {
                    return true;
                }, function (response) {
                    return $q.reject(response.data);
                });
        }

        function studioSubmit(data) {
            return $http.post(urls.studio_submit, data).then(
                function(response) {
                    return response.data;
                },
                function(error) {
                    return $q.reject(error.data);
                }
            );
        }
    }])

    .controller('EditSettingsController', ['$scope', 'studioBackendService', 'notify', 'data',
        function ($scope, studioBackendService, notify, data) {
            var self = this;
            self.algos = data.algos;
            self.data = {};
            self.data.display_name = data.display_name;
            self.data.question_text = data.question_text;
            self.data.rationale_size = data.rationale_size;
            self.image_position_locations = data.image_position_locations;

            self.data.options = data.options;
            self.data.correct_answer = data.correct_answer;
            if (data.correct_rationale)
                self.data.correct_rationale = data.correct_rationale;
            self.data.algo = data.algo;
            self.data.seeds = data.seeds;

            self.cancel = function() {
                notify('cancel', {});
            };
            self.add_option = function() {
                self.data.options.push(
                    {'text': '', 'image_url': '', 'image_position': 'below', 'show_image_fields': 0, 'image_alt': ''}
                );
            };
            self.delete_option = function(index) {
                self.data.options.splice(index, 1);
            };
            self.addSeed = function() {
                self.data.seeds.push({});
            };
            self.deleteSeed = function(index) {
                self.data.seeds.splice(index, 1);
            };

            self.show_image_fields = function( index ) {

            	if ( index === false ) {
                    // This is just for the 'quetion', i.e. not an array of possibles
            		self.data.question_text.show_image_fields = !self.data.question_text.show_image_fields;

                    if ( !self.data.question_text.show_image_fields ) {
                        self.data.question_text.image_url = '';
                    }

            	} else {

                    // This is for the options
            		self.data.options[index].show_image_fields = !self.data.options[index].show_image_fields;

                    if ( !self.data.options[index].show_image_fields ) {
                        self.data.options[index].image_url = '';
                    }

            	}

            };

            self.submit = function() {
                notify('save', {state: 'start', message: "Saving"});

                return studioBackendService.submit(self.data).catch(function(errors) {
                    notify('error', {
                        'title': 'Error saving question',
                        'message': errors.errors
                    });
                }).finally(function() {
                    notify('save', {state: 'end'})
                });
            };
        }]);

function PIEdit(runtime, element, data) {

    "use strict";
    // The workbench doesn't support notifications.
    var notify = $.proxy(runtime.notify, runtime) || function () {};

    var urls = {
        'studio_submit': runtime.handlerUrl(element, 'studio_submit'),
        'validate_form': runtime.handlerUrl(element, 'validate_form')
    };

    angular.module('constants').constant('urls_edit', urls);
    // inject xblock runtime, notification and data
    angular.module('ubcpi_edit').value('notify', notify).value('data', data);

    $(function () {
        angular.bootstrap(element, ["ubcpi_edit"], {strictDi: true});
    });
}
