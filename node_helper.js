const exec = require('child_process').exec;
const fs = require('fs');
const Gpio = require('onoff').Gpio;

var commandDict = {
    "js" : "node",
    "py" : "python",
    "sh" : "sh"
};

module.exports = NodeHelper.create({

    socketNotificationReceived: function (notification, payload) {
        const self = this;

        if(notification === "CONFIG"){
            this.config = payload;
            this.pir = new Gpio(this.config.sensorPin, 'in', 'both');

            this.pir.watch(function(err, value) {
                if (value == valueOn) {
                    self.sendSocketNotification("USER_PRESENCE", true);
                    if(config.turnOffDisplay){
                        execute(buildCommand("/default/displayOn.sh"));
                    }
                }
            });
        } else if (notification === "TIMER_EXPIRED") {
            for(var i = 0; i < this.config.callbackScripts.length; i++){
                execute(buildCommand(this.config.callbackScripts[i]), function (stdout) {
                    console.log(stdout);
                });
            }
            if(config.turnOffDisplay){
                execute(buildCommand("/default/displayOff.sh"));
            }
        }
    },


});

function buildCommand(fileName){
    var file = __dirname + "/callbackScripts/" + fileName;
    var fileExtension = file.split(".").slice(-1).pop();
    return commandDict[fileExtension] + " " + file;
}

function execute(command, callback){
    exec(command, function(error, stdout, stderr){
        if(error){
            console.log(stderr);
        }else{
            callback(stdout);
        }
    });
}