var express = require('express');
var router = express.Router();
var exec = require('ssh-exec')
var Promise = require('promise');
var io = require('socket.io').listen(8000);


var finalData = [];
var finalTime = []
var dataTable = [];


function getData() {
    finalData = [];
    finalTime = [];
    dataTable = [];

    // static Date
    // --start 920804100 --end 920809200

    // current Date
    // --start $(($(date +%s%N)/1000000))-1000 --end $(($(date +%s%N)/1000000)) --step 300

    var dataPromise = new Promise(function (resolve, reject) {
        exec('rrdtool xport --json --start 920804100 --end 920809200 --step 300 DEF:speed=test.rrd:speed:AVERAGE XPORT:speed:Speed', {
            user: 'dev-03',
            host: 'rrd.rndhub.uk',
            password: 'uzmhT6bWY9KEhPgO'
        }, function (err, result, stderr) {
            if (err || stderr)
                reject(err, 'Something went wrong');
            var startTime, endTime, step;
            if(result){
                var resultData = JSON.parse(result);
                myResult = resultData
                var newTimeArray = [];
                var realData = [];
                var formattedTIme;
                var dataArray = [];
    
                dataArray = resultData['data'];
                startTime = resultData['meta'].start;
                timeElapse = startTime;
                endTime = resultData['meta'].end;
                step = resultData['meta'].step;
    
                dataArray.forEach(element => {
                    formattedTIme = timeElapse;
                    formattedTIme = new Date(formattedTIme)
                    // formattedTIme = formattedTIme.getHours() + ':' + formattedTIme.getMinutes() + ':' + formattedTIme.getSeconds() + ':' + formattedTIme.getMilliseconds();
    
                    newTimeArray.push(formattedTIme);
                    timeElapse = timeElapse + step;
                });
    
                dataArray.forEach(element => {
                    element.forEach(data => {
                        realData.push(data)
                    });
                });
    
                // final data formatted time and data
                for (let i = 0; i < realData.length; i++) {
                    if (realData[i] != null) {
                        finalData.push((realData[i] * 1000).toFixed(2))
                        finalTime.push(newTimeArray[i])
                    }
                }
                var finalResult = { finalTime: finalTime, finalData: finalData }
                finalTime = [];
                finalData = [];
                realData = [];
            }
            

            resolve(finalResult);
        });
    });
    return dataPromise;
}

router.get('/', function (req, res, next) {
    dataTable = [];
    getData().then(function (result) {
        dataTable.push(result.finalTime)
        dataTable.push(result.finalData)
        finalTime = [];
        finalData = [];
        res.render('index', { title: 'Express', data: dataTable });

        io.on('connection', function (socket) {
            console.log('A user connected');
            setInterval(function () {
                getData().then(function (result) {
                    dataTable = [];
                    dataTable.push(result.finalTime)
                    dataTable.push(result.finalData)
                    socket.emit('updateData', dataTable);
                });
            }, 10000)
        });
    });
});



module.exports = router
