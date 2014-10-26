var socket = io();
var app = angular.module('buzzerApp', ['ngSanitize', 'ngAudio', 'cfp.hotkeys']);
app.controller('BuzzerController', function($scope, $location, ngAudio, hotkeys) {

    $scope.admin = ($location.$$path == "/admin");
    $scope.form = {
        name: "User",
    }
    $scope.socket = socket;
    $scope.scores = [4, 10];

    if ($scope.admin) {
        hotkeys.add({
            combo: 'space',
            description: 'Reset Buzzer',
            callback: function() {
                $scope.reset();
            }
        });
    }
    else {
        hotkeys.add({
            combo: 'space',
            description: 'Reset Buzzer',
            callback: function() {
                $scope.buzz();
            }
        });
    }

    if ($scope.admin) {
        angular.forEach($scope.scores, function(score) {
            var key = score % 10;
            hotkeys.add({
                combo: '' + key,
                description: 'Score ' + score + " points for buzzed team",
                callback: function() {
                    $scope.scorebuzzed(score);
                }
            });
            hotkeys.add({
                combo: 'shift+' + key,
                description: 'Score ' + score + " points for the other team",
                callback: function() {
                    $scope.scorebuzzed(score, true);
                }
            });
        });
    }

    $scope.$watch('form.name', function(newValue) {
        socket.emit('name', newValue);
    });

    socket.on('connect', function() {
        if (!$scope.admin) {
            socket.emit('join', {});
        }
    });

    socket.on('state', function(state) {
        $scope.state = state;
        $scope.$apply();
    });

    socket.on('id', function(id) {
        $scope.id = id;
        console.log($scope.id);
    });

    $scope.buzz = function() {
        socket.emit('buzz');
    };

    $scope.reset = function() {
        socket.emit('reset');
    };

    $scope.score = function(team, score) {
        socket.emit('score', {
            team: team,
            score: score
        });
    };

    $(window).focus(function() {
        socket.emit('focus', {
            focus: true
        });
    }).blur(function() {
        socket.emit('focus', {
            focus: false
        });
    });

    $scope.scorebuzzed = function(score, invert) {
        if ($scope.state.buzz) {
            invert = invert || false;
            angular.forEach($scope.state.teams, function(team, teamName) {
                var good = false;
                angular.forEach(team.clients, function(use, id) {
                    if (id === $scope.state.buzz) {
                        good = true;
                    }
                });
                if (good != invert) {
                    $scope.score(teamName, score);
                }
            })
        }
    };

});
