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
            socket.emit('autojoin', {});
        }
    });

    socket.on('state', function(state) {
        $scope.state = state;
        $scope.$apply();
    });
    
    socket.on('client', function(data){
        console.log(data.client);
        if(data.client === null){
            delete $scope.state.clients[data.id];
        }else{
            $scope.state.clients[data.id] = data.client;
        }
        $scope.$apply();
    });
    
    socket.on('buzz', function(data){
        $scope.state.buzz = data.id;
        $scope.$apply();
    });
    
    socket.on('score', function(data){
        $scope.state.teams[data.team].score = data.score;
        $scope.$apply();
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
            var team = $scope.state.clients[$scope.state.buzz].team
            for(var teamId in $scope.state.teams){
                if((team == teamId && !invert) || (team != teamId && invert)){
                    $scope.score(teamId, score);
                }
            }
        }
    };

});
