var socket = io();
var app = angular.module('buzzerApp', ['ngSanitize', 'ngAudio', 'cfp.hotkeys']);
app.controller('BuzzerController', function($scope, $location, ngAudio, hotkeys) {

    $scope.admin = ($location.$$path == "/admin");
    $scope.form = {
        name: "User",
        teams: {}
    };
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
        $scope.$watch('state.teams', function(teams, old) {
            for (var teamId in teams) {
                if (old === undefined || (teams[teamId].name != old[teamId].name && $scope.form.teams[teamId] == old[teamId].name)) {
                    $scope.form.teams[teamId] = teams[teamId].name;
                }
            }
        }, true);
        $scope.$watch('form.teams', function(teams) {
            for (var teamId in teams) {
                if ($scope.form.teams[teamId] != $scope.state.teams[teamId].name) {
                    socket.emit("teamname", {
                        team: teamId,
                        name: $scope.form.teams[teamId]
                    });
                }
            }
        }, true);
    }

    $scope.$watch('form.name', function(newValue) {
        socket.emit('name', newValue);
    });

    socket.on('connect', function() {
        if (!$scope.admin) {
            socket.emit('autojoin', {});
        }
    });

    socket.on('id', function(id) {
        $scope.id = id;
    });

    socket.on('state', function(state) {
        $scope.state = state;
        $scope.$apply();
    });

    socket.on('client', function(data) {
        if (data.client === null) {
            delete $scope.state.clients[data.id];
        }
        else {
            $scope.state.clients[data.id] = data.client;
        }
        $scope.$apply();
    });

    socket.on('buzz', function(data) {
        $scope.state.buzz = data.id;
        $scope.$apply();
    });

    socket.on('score', function(data) {
        $scope.state.teams[data.team].score = data.score;
        $scope.$apply();
    });

    socket.on('teamname', function(data) {
        $scope.state.teams[data.team].name = data.name;
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
            var team = $scope.state.clients[$scope.state.buzz].team;
            for (var teamId in $scope.state.teams) {
                if ((team == teamId && !invert) || (team != teamId && invert)) {
                    $scope.score(teamId, score);
                }
            }
        }
    };

    $scope.setteam = function(team) {
        socket.emit('setteam', {
            team: team
        });
    };

});
