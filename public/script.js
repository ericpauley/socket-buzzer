var socket = io();
angular.module('buzzerApp', ['ngSanitize', 'ngAudio'])
.controller('BuzzerController', function($scope, $location, ngAudio) {

    $scope.admin = ($location.$$path == "/admin")
    $scope.name = "User"
    $scope.socket = socket
    $scope.scores = [4,10]

    $scope.$watch('name', function(newValue){
        socket.emit('name', newValue);
    })

    socket.on('connect', function(){
        if(!$scope.admin){
            socket.emit('join', {});
        }
    })

    socket.on('state', function(state){
        $scope.state = state;
        $scope.$apply()
    })

    socket.on('id', function(id){
        $scope.id = id;
        console.log($scope.id)
    })

    $scope.buzz = function(){
        socket.emit('buzz')
    }

    $scope.reset = function(){
        socket.emit('reset')
    }

    $scope.score = function(team, score){
        socket.emit('score', {team:team, score: score})
    }
    
});
