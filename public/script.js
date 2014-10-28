var app = angular.module('buzzerApp', ['ngSanitize', 'ngAudio', 'cfp.hotkeys', 'ngRoute']);

app.controller('PingController', function($scope, $timeout){
    $scope.socket = io();
    $scope.lastPing = new Date().getTime();
    $scope.ping = 0;
    $scope.sendPing = function(){
        $scope.lastPing = new Date().getTime();
        $scope.socket.emit('ping');
    };
    $scope.socket.on('ping', function(){
        $scope.ping = new Date().getTime()-$scope.lastPing;
        $scope.$apply();
        $timeout($scope.sendPing, 1000);
    });
    $scope.sendPing();
});

app.controller('BuzzerController', function($scope, $location, $controller) {
    $scope.socket = io();

    $scope.socket.on('id', function(id) {
        $scope.id = id;
    });

    $scope.socket.on('state', function(state) {
        console.log('state');
        $scope.state = state;
        $scope.$apply();
    });

    $scope.socket.on('client', function(data) {
        if (data.client === null) {
            delete $scope.state.clients[data.id];
        }
        else {
            $scope.state.clients[data.id] = data.client;
        }
        $scope.$apply();
    });

    $scope.socket.on('buzz', function(data) {
        $scope.state.buzz = data.id;
        $scope.$apply();
    });

    $scope.socket.on('score', function(data) {
        $scope.state.teams[data.team].score = data.score;
        $scope.$apply();
    });

    $scope.socket.on('teamname', function(data) {
        $scope.state.teams[data.team].name = data.name;
        $scope.$apply();
    });
});

app.controller('SpectateController', function($scope, $controller){
    $controller('BuzzerController', {
        $scope: $scope
    });
    $scope.admin = false;
});

app.controller('AdminController', function($scope, hotkeys, $controller, ngAudio) {
    $controller('BuzzerController', {
        $scope: $scope
    });
    $scope.sound = ngAudio.load("beep.mp3");
    $scope.admin = true;
    $scope.form = {
        teams: {}
    };
    $scope.scores = [4, 10];
    hotkeys.add({
        combo: 'space',
        description: 'Reset Buzzer',
        callback: function() {
            $scope.reset();
        }
    });
    $scope.socket.on('buzz', function(data) {
        if(data.id != null){
            console.log("test");
            $scope.sound.play();
        }
    });
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
                $scope.socket.emit("teamname", {
                    team: teamId,
                    name: $scope.form.teams[teamId]
                });
            }
        }
    }, true);
    $scope.reset = function() {
        $scope.socket.emit('reset');
    };

    $scope.score = function(team, score) {
        $scope.socket.emit('score', {
            team: team,
            score: score
        });
    };
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
});

app.controller('ClientController', function($scope, $location, hotkeys, $controller) {
    $controller('BuzzerController', {
        $scope: $scope
    });
    $scope.admin = false;
    $scope.form = {
        name: "User",
    };
    hotkeys.add({
        combo: 'space',
        description: 'Reset Buzzer',
        callback: function() {
            $scope.buzz();
        }
    });

    $scope.$watch('form.name', function(newValue) {
        $scope.socket.emit('name', newValue);
    });

    $scope.buzz = function() {
        $scope.socket.emit('buzz');
    };

    $(window).focus(function() {
        $scope.socket.emit('focus', {
            focus: true
        });
    }).blur(function() {
        $scope.socket.emit('focus', {
            focus: false
        });
    });

    $scope.setteam = function(team) {
        $scope.socket.emit('setteam', {
            team: team
        });
    };
    $scope.socket.on('connect', function() {
        if (!$scope.admin) {
            $scope.socket.emit('autojoin', {});
        }
    });

});

app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/quiz', {
            templateUrl: 'client.html',
            controller: 'ClientController'
        })
        .when('/quiz/admin', {
            templateUrl: 'admin.html',
            controller: 'AdminController'
        })
        .when('/quiz/spectate', {
            templateUrl: 'spectate.html',
            controller: 'SpectateController'
        })
        .otherwise({
            redirectTo: '/quiz'
        });

    // configure html5 to get links working on jsfiddle
    $locationProvider.html5Mode(true);
});