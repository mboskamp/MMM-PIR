Module.register("MMM-PIR", {

    counter: null,
    customCounter: null,
    interval: null,

    defaults: {
        sensorPin: 4,
        delay: 3000,
        turnOffDisplay: true,
        showCountdown: true,
        callbackScripts: []
    },

    start: function () {
        Log.log(this.name + ' is started!');
        this.sendSocketNotification("CONFIG", this.config);
    },

    getDom: function () {
        var html = document.createElement("div");
        html.innerHTML = formatMillis(this.counter);
        return html;
    },

    getCommands: function (commander) {
        commander.add({
            command: 'resetPir',
            callback: 'resetCountdown',
            description: 'Resets the countdown to configured settings.',
        });
        commander.add({
            command: 'resetPirDefaults',
            callback: 'resetDefaults',
            description: 'Reset the countdown to default settings.',
        });
        commander.add({
            command: 'setCustomPirCountdown',
            callback: 'setCustomCountdown',
            description: 'Configure a custom countdown. (in seconds)'
        });
    },

    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        }
    },

    notificationReceived: function (notification, payload) {
        if (notification === 'DOM_OBJECTS_CREATED' || notification === "USER_PRESENCE") {
            //DOM creation complete, let's start the module
            this.startCountdown();
        }
    },

    startCountdown: function () {
        var self = this;

        self.resetCountdown();

        self.interval = setInterval(function () {
            self.counter -= 1000;
            if (self.counter <= 0) {
                self.sendSocketNotification('TIMER_EXPIRED');
                clearInterval(self.interval);
            }
            self.updateDom();
        }, 1000);
    },

    resetDefaults: function () {
        this.counter = this.config.delay;
        this.updateDom();
    },

    resetCountdown: function () {
        if (this.config.showCountdown) {
            if (this.customCounter != null) {
                this.counter = this.customCounter;
                this.updateDom();
            } else {
                this.resetDefaults();
            }
        }
    },

    setCustomCountdown: function (commander, handler) {
        var ccd = parseInt(handler.args);
        if (isNaN(ccd) || ccd < 1) {
            handler.reply("TEXT", this.translate("INVALID_PARAM_ERROR", {
                "command": "setCustomPirCountdown",
                "paramcount": 1,
                "paramtypes": "integer"
            }));
        } else {
            this.customCounter = ccd * 1000;
            this.resetCountdown();
        }
    }
});

function formatMillis(millis) {
    return new Date(millis).toUTCString().match(/\d{2}:\d{2}:\d{2}/)[0];
}