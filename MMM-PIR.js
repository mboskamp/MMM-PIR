Module.register("MMM-PIR", {

    defaults: {
        sensorPin: 4,
        delay: 10000,
        turnOffDisplay: true,
        showCountdown: true,
        callbackScripts: []
    },

    start: function () {
        Log.log(this.name + ' is started!');
        this.sendSocketNotification("CONFIG", this.config);

        moment.locale(config.language);
    },

    getDom: function () {
        if(this.config.showCountdown) {
            var self = this;

            var html = document.createElement("div");
            html.className = "wrapper";

            if (typeof self.counter !== "undefined") {
                var headline = document.createElement("div");
                headline.className = "head";
                headline.innerText = self.translate("HEADER");
                html.appendChild(headline);

                var time = document.createElement("div");
                time.className = "time";
                time.innerText = formatMillis(this.counter);
                html.appendChild(time);

                if (typeof self.presence === "object") {
                    var last = document.createElement("div");
                    last.className = "last";
                    last.innerText = self.translate("LAST_USER_PRESENCE") + " " + self.presence.format("dddd, LL HH:mm:ss");
                    html.appendChild(last);
                }

            }

            return html;
        }
    },

    getStyles: function () {
        return ["mmm-pir-style.css"];
    },

    getScripts: function () {
        return ["moment.js"];
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

    socketNotificationReceived: function (notification, payload) {
        if (notification === "USER_PRESENCE") {
            this.presence = moment();
            this.startCountdown();
        }
    },

    notificationReceived: function (notification, payload) {
        if (notification === 'DOM_OBJECTS_CREATED') {
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
        clearInterval(this.interval);
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
            handler.reply("TEXT", this.translate("TELEGRAM_COMMAND_ERROR", {"command": "setCustomPirCountdown"}));
        } else {
            this.customCounter = ccd * 1000;
            this.resetCountdown();
        }
    }
});

function formatMillis(millis) {
    return new Date(millis).toUTCString().match(/\d{2}:\d{2}:\d{2}/)[0];
}