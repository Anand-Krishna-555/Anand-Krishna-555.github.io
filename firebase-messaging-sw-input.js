// import { console_log } from "./src/configurations/debug.config";

importScripts('https://www.gstatic.com/firebasejs/5.5.2/firebase.js');
importScripts('https://www.gstatic.com/firebasejs/5.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.5.2/firebase-messaging.js');

/**
 * Config Variables
 */

// const { senderId } = Resu_sdk_manifest.pushConfig;

/**
 * APIs listing
 */

const campaignTracking = "/webCampaignTracking";

const Custom_Events = "/CustomEvents";

const User_Journey = "/UserJourney";

const User_Register = "/UserRegister";

const Web_SDK_Blast = "/webSDKBlast";

/**
 * BaseURL Listing
 */

const RUN_Baseurl = 'https://sdk.resu.io/Campaign';

const BIZ_Baseurl = 'https://b.resu.io/Campaign';

const Team_Baseurl = 'https://l.resu.io/Campaign';

const RUN_Rsut_Baseurl = 'https://sdk.rsut.io/Campaign';

const environment = "RUN";

var flag = false;

/**
 * Method for BaseUrl
 */

const getBaseUrl = async (apiMethod) => {

    let Baseurl = '';
   
    switch (environment) {

        case "RUN":
            Baseurl = RUN_Baseurl
            break;
        case "BIZ":
            Baseurl = BIZ_Baseurl
            break;
        case "TEAM":
            Baseurl = Team_Baseurl
            break;
        default:
            Baseurl = RUN_Baseurl
            break;
    }
    Baseurl = await getIDB('_tenantId').then(res => { return Baseurl =  (res == '5f7a2e8e_1bdb_4739_9d28_278a2759394c') ? RUN_Rsut_Baseurl : RUN_Baseurl })

    console.log(`Environment: ${environment}, BaseUrl: ${Baseurl}`);
    return Baseurl + apiMethod;
}


var dataToRepresent = {}, representNotificationData = {};
var definedRules = [];
var rulesMethod = {};

const respondToServer = function (_payload, id) {
    id = msgId;
    var retryCount = 0;
    Promise.all([getIDB('Res_Passport_Id'), getIDB('Res_Profile_Id'), getIDB('_tenantId')]).then(res => {
        let payload = {
            ..._payload,
            id: notification_id || id,
            passportId: res[0] || '',
            profileID: res[1] || '',
            tenantId: res[2] || '',
            domainName: self.registration.scope,
            // deviceId: clientInfo.deviceId,
            status: _payload.status_code,
            isConversion: _payload.isConversion,
            smartCode: _payload.smartCode
        }
        let option = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }
        //console.log(option, id);
        //const data = getBaseUrl(campaignTracking);
        getBaseUrl(campaignTracking).then(data =>{
            const postData = (data, option) => fetch(data, option).then(res => res.json()).then(res => { //console.log(res) },err=> {
                // //console.log('err on posting... retrying...: '+retryCount+' ' ,err);
                if(retryCount < 5){
                    setTimeout(() => { 
                        postData(data, option);
                        retryCount++;
                    }, 1500);
                } else {
                    // //console.log('retrying stopped')
                }
            });
            postData(data, option);
        })
        // fetch("https://sdklb13.resu.io/Campaign/customeventstest", option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
    });
};

var actions = '', clientInfo = null, button_actions = [],
    showInAppNotification = "false", notification_id = null, pass_id = '';
var fcm_senderId = '';
var msgId = null;
var queuedmsg = [], db, passTimer = null;


function addIDB(key, value) {
    return new Promise(function (resolve, reject) {
        try {
            let openRequest = indexedDB.open("resuldata", 1);
            openRequest.onsuccess = function () {
                try {
                    db = openRequest.result;
                    try {
                        if (!db.objectStoreNames.contains('Res_Data')) {
                            db.createObjectStore('Res_Data', { keyPath: 'key' });
                        }
                    } catch (e) { }
                    //console.log('openRequest db', openRequest, db);
                    let dbTransaction = db.transaction(["Res_Data"], "readwrite");
                    var request = dbTransaction.objectStore("Res_Data").put({ key: btoa(key), value: btoa(btoa(JSON.stringify(value))) });
                    request.onsuccess = function (event) {
                        resolve("Added to database.");
                    };
                    request.onerror = function (event) {    
                        reject('error: ' + event);  
                    }
                } catch (error) {
                    //console.log('addIDB err:', error);
                }
            };
        } catch (error) {
            //console.log('addIDB err:', error);
        }
    })
}

function getIDB(key) {
    //console.log('getIDB', key);
    return new Promise(function (resolve, reject) {
        try {
            let openRequest = indexedDB.open("resuldata", 1);
            openRequest.onsuccess = function () {
                try {
                    db = openRequest.result;
                    try {
                        if (!db.objectStoreNames.contains('Res_Data')) {
                            db.createObjectStore('Res_Data', { keyPath: 'key' });
                        }
                    } catch (e) { }
                    //console.log('openRequest db', openRequest, db);
                    //let dbTransaction = db.transaction(["Res_Data"]);
                    // var objectStore = dbTransaction.objectStore("Res_Data");
                    let dbTransaction = db.transaction(["Res_Data"], "readwrite");
                    var objectStore = dbTransaction.objectStore("Res_Data");
                    var objectStoreRequest = objectStore.get(btoa(key));
                    objectStoreRequest.onsuccess = function (event) {
                        let res = objectStoreRequest.result;
                        if (!!res && res.value) {
                            try {
                                res.value = JSON.parse(atob(atob(res.value)));
                                resolve(res.value);
                            } catch (err) {
                                reject(err);
                            }
                        } else {
                            reject('Not found');
                        }
                    }
                    objectStoreRequest.onerror = function (err) {
                        reject(err);
                    }
                } catch (error) {
                    reject(error);
                }
            };
        } catch (error) {
            reject(error);
        }
    });
}
var _client = null;
addEventListener('fetch', event => {
    event.waitUntil(function () {
        if (!event.clientId) {
            return;
        };
        clients.get(event.clientId).then(client => {
            if (!client) {
                return;
            }
            _client = client;
            if (showInAppNotification == "true") {
                //console.log('showInAppNotification == "true"');
                //console.log('representNotificationData', representNotificationData);
                client.postMessage({
                    msg: representNotificationData
                });
                self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
                    if (clients && clients.length) {
                        clients[0].postMessage({ msg: representNotificationData });
                    }
                });
            }
            if (!!pass_id) {
                //console.log('pass_id: ', pass_id);
                client.postMessage({ pass_id: pass_id });
            }
        })

    }());
});

self.addEventListener('install', function (event) {
    self.skipWaiting();
});
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim()); // Become available to all pages
    setInterval(RetryFailureNotification,15000);
    // setInterval(checkDropOffData,5000);
});
self.onnotificationclose = (event) => {
    //console.log('Notification dismissed')
    try {
        const option = {
            action: 'dismiss',
            status_code: '3',
            isConversion: "false",
            smartCode: ""
        };
        respondToServer(option, msgId);
    } catch (e) { }
}

self.onnotificationclick = (event) => {
    //console.log('notification click', event);
    const clickedNotification = event.notification;
  clickedNotification.close();
    if (!!event.notification.data) {
        const eventBgdata = event.notification.data.representNotificationData;
        if (!!eventBgdata) {
            actions = eventBgdata.click_actions
        }
        if (event.notification.data.showInAppNotification === 'true') {
            //console.log('showInAppNotification ', event.notification.data.showInAppNotification);
            //console.log('representNotificationData ', event.notification.data.representNotificationData);
            showInAppNotification = event.notification.data.showInAppNotification;
            representNotificationData = event.notification.data.representNotificationData;
        }
    }

    var option = {};
    if (!!event.notification.data && !!event.notification.data.FCM_MSG) {
        actions = event.notification.data.FCM_MSG.notification.click_action;
        //console.log('actions1' + actions);
        if (!(!!actions)) {
            //console.log('empty action 1: ', actions);
            actions = self.location.origin;
        }
        clients.openWindow(actions).then((windowClient) => {
            ////console.log(windowClient);
        });
        return false;
    } else {
        //console.log('normal foreground ' + actions);
    }
    //console.log('event.action: ' + event.action);
    if (!button_actions) {
        button_actions = event.notification.actions;
    }
    if (!!button_actions && button_actions.length > 0) {
        button_actions = event.notification.actions;
    }
    if (!!event.notification.data && event.notification.data.showInAppNotification === 'false') {
        if (!!event.notification.data.actions) {
            button_actions = event.notification.data.actions;
        }
        if (!!event.notification.data.representNotificationData) {
            const _bgdata = event.notification.data.representNotificationData.data;
            const _bgaction = JSON.parse(_bgdata).actions;
            button_actions = _bgaction;
        }
    }
    if (Object.keys(rulesMethod).includes('notificationClick')) {
        rulesMethod.notificationClick();
    }
    // if (!event.action) {
    //     event.action = ''
    // }
    //console.log('event.action', event.action);
    switch (event.action) {
        case '':
            option = {
                action: 'opened',
                status_code: '2',
                isConversion: "false",
                smartCode: ""
            }
            if (!(!!actions)) {
                //console.log('empty action 2: ', actions)
                actions = self.location.origin;
            }
            clients.openWindow(actions).then((windowClient) => {
                //console.log(windowClient);
            });

            if (Object.keys(rulesMethod).includes('notificationViewClick')) {
                rulesMethod.notificationViewClick();
            }
            break;

        case 'later':
            //console.log(event.action);
            //console.log('button_actions', button_actions)
            let laterObj = button_actions.filter(actions => actions.action == event.action)[0];
            option = {
                action: event.action,
                status_code: '4',
                isConversion: "false",
                smartCode: ""
            }
            //console.log('later clicked!', laterObj, dataToRepresent, representNotificationData);
            setTimeout(() => {
                //console.log('later function executed');
                var _data = null;
                if (!Object.keys(dataToRepresent).length) {
                    //console.log('keys not found')
                    // _data = { data: { data: representNotificationData } }
                    showBgNotification(dataforlater);
                } else {
                    // ////console.log('keys found')
                    _data = dataToRepresent
                    representNotification(_data);
                }
            }, laterObj.duration);
            if (Object.keys(rulesMethod).includes('notificationLaterClick')) {
                rulesMethod.notificationLaterClick();
            }

            break;

        case 'dismiss':
            //console.log(event.action);
            option = {
                action: event.action,
                status_code: '3',
                isConversion: "false",
                smartCode: ""
            }
            if (Object.keys(rulesMethod).includes('notificationDismissClick')) {
                rulesMethod.notificationDismissClick();
            }

            break;

        default: {
            //console.log('event', event)
            let customObj = button_actions.filter(actions => actions.action == event.action)[0];
            //console.log('button_actions', button_actions, customObj);
            //console.log('customObj', JSON.stringify(customObj));
            var option = {
                action: event.action,
                status_code: customObj.actionId,
                isConversion: "false",
                smartCode: ""
            }
            let url = customObj.actionUrl || '';
            //console.log('!(!!url)', !(!!url))
            if (!(!!url)) {
                url = self.location.origin;
            }
            //console.log('url', url)
            clients.openWindow(url).then(function (windowClient) {
                // do something with the windowClient.
            });
        }
            break;
    };
    respondToServer(option, msgId);
};

self.addEventListener('message', data => {
    console.log("message event called");
    let mainWindow = null;
    try {
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
            //console.log('event message', data, clients);
            mainWindow = clients;
            //console.log('event message mainWindow', mainWindow);

        })
    } catch (error) {

    }
    if ('event' in data.data) {
        if ("ping" == data.data.event) {
            console.log("Pinged");
            try {

                self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
                    if (clients && clients.length) {
                        clients[0].postMessage({ ping: "success" });
                    }
                });
            } catch (error) {

            }
        }
        if ("customEventTest" == data.data.event) {
            const option = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.data.payload || data.data.data)
            }
            //console.log('customEventTest triggred');
            fetch("https://sdklb13.resu.io/Campaign/customeventstest", option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
        }
        if ("resu_post" == data.data.event) {
            const option = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.data.data.payload)
            }
            //console.log('resu_post triggred');
            fetch(data.data.data.url, option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
        }
        if ("customEvent" == data.data.event) {
            //console.log('Custome event triggred', data.data);
            Promise.all([getIDB('Res_Passport_Id'), getIDB('Res_Profile_Id'), getIDB('_tenantId'), getIDB('deviceId')]).then(res => {
                try {
                    const payload = {
                        ...data.data.payload,
                        passportId: res[0] || '',
                        profileID: res[1] || '',
                        tenantId: res[2] || '',
                        deviceId: res[3] || ''
                    }
                    const option = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }                  
                    
                    //fetch(getBaseUrl(Custom_Events), option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
                    
                    getBaseUrl(Custom_Events).then(apiUrl =>{
                        let apiRandId      = Date.now();
                        AddFailureApiDataToIndexDBSw(apiUrl,payload,apiRandId,"customEventsClientSw")
                         fetch(apiUrl, option).then(res => {
                            if(res.ok){
                                RemoveFailureApiDataFromIndexDBSw(apiRandId)
                              return res.json();
                            }
                        }).then(res => {/*//console.log(res)*/ });
                    })
                } catch (error) { }
            })
        } else if ("userRegisterEvent" == data.data.event) {
            const option = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.data.payload)
            }
            //console.log('userRegisterEvent triggred', JSON.stringify(data.data.payload));
                //fetch(getBaseUrl(User_Register), option).then(res => res.json()).then(res => {
            getBaseUrl(User_Register).then(apiUrl =>{
                fetch(apiUrl, option).then(res => res.json()).then(res => {
                    //console.log('pass_id', res);
                    if (res.data != 'success' && !!res.data) {
                        pass_id = res.data
                        passTimer = setInterval(() => {
                            try {
                                self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
                                    if (clients && clients.length) {
                                        clients[0].postMessage({ pass_id: pass_id });
                                        //console.log('posted to client');
                                    }
                                });
                            } catch (error) {

                            }
                        }, 2000);
                        setTimeout(() => {
                            clearInterval(passTimer)
                        }, 20000);
                    }
                });
            });
        }
        else if ("userJourney" == data.data.event) {
            const option = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.data.payload)
            }
            //console.log('userJourney triggred', data.data);
           // fetch(getBaseUrl(User_Journey), option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
           getBaseUrl(User_Journey).then(apiUrl=>{
                fetch(apiUrl, option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
            })
        }else if ("webSdkBlastEvent" == data.data.event) {
            const option = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.data.payload)
            }
            const apiUrl = data.data.url;
            return fetch(apiUrl, option).then(res => res.json()).then(res => { console.log(res); return res; });
        }
        else if ('customMsgEvent' == data.data.event) {
            dataToRepresent = data;
            clientInfo = data.data;
            //console.log("dataToRepresent", dataToRepresent);
            // if("inAppNotification" in data.data.data){
            //console.log(data.data.data);
            // if (notification_id != data.data.data["id"]) {
            notification_id = data.data.data["id"];
            //console.log(notification_id);
            representNotification(dataToRepresent);
            // } else {
            //     //console.log('notification already presented');
            // }
        } else if (data.data.event == "dismissInapp") {
            console.log('dismissInapp tapped');
            showInAppNotification = "false";
            representNotificationData = {};
        } else if (data.data.event == "notificationqueue") {
            console.log('notificationqueue', data.data.payload.data);
            showBgNotification(data.data.payload);
        } else if (data.data.event == "checkSession") {
            self.registration.showNotification('session closed!');
        } else if (data.data.event == "clear_pass_id") {
            pass_id = '';
            clearInterval(passTimer)
        } else if (data.data.event == "dismiss_TBN") {
            //console.log('received event');
            //console.log('mainWindow', mainWindow);
            //console.log('mClients', self.clients);
            
            // const channel = new BroadcastChannel('sw-messages');
            // channel.postMessage({ title: 'Hello from SW' });
            self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
                //console.log('iClients', clients)
                if (clients && clients.length) {
                    clients[0].postMessage({ event: 'dismiss_TBN_tapped' });
                    mainWindow[0].postMessage({ event: 'dismiss_TBN_tapped' });
                }
            });
        } else if ("lastEvent" == data.data.event) {
            try {
                if(data.data.data) {    
                    Promise.all([getIDB('Res_Passport_Id'), getIDB('Res_Profile_Id'), getIDB('_tenantId'), getIDB('deviceId'), 
                        getIDB('domainName'), getIDB('sessionId')]).then(res => {
                            let commonPayloadData = res;
                            try {
                                let tenantID = commonPayloadData[2] || ''
                                if(tenantID == "bb073c1c_0589_4bc3_bb5d_eaf9ef5364e5" && data.data.data != "Appointment Booked") {
                                    let dropOff = data.data.data + "_drop_off";
                                    Promise.all([getIDB('u_email'), getIDB('u_phoneNumber')]).then(res => {
                                        if(!!res){
                                            let payload = {
                                                eventName : dropOff,
                                                passportId: commonPayloadData[0] || '',
                                                profileID: commonPayloadData[1] || '',
                                                tenantId: commonPayloadData[2] || '',
                                                deviceId: commonPayloadData[3] || '',
                                                domainName: commonPayloadData[4] || '',
                                                sessionId: commonPayloadData[5] || '',
                                                data: {
                                                    u_email: res[0] || '',
                                                    u_phoneNumber: res[1] || ''
                                                }
                                            }

                                            // addIDB("log2", JSON.stringify(payload));
                                
        
                                            const option = {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(payload)
                                            }       
                                            
                                            let apiPayload = {
                                                ...option,
                                                "time" : new Date().toString()
                                            }

                                            getBaseUrl(Custom_Events).then(apiUrl =>{
                                                let apiRandId = Date.now();
                                                AddFailureApiDataToIndexDBSw(apiUrl,payload,apiRandId,"dropOffDataSw")
                                                fetch(apiUrl, option).then(res => {
                                                    if(res.ok){
                                                        addIDB("lastEventSuccess", JSON.stringify(apiPayload));
                                                        RemoveFailureApiDataFromIndexDBSw(apiRandId);
                                                        return res.json();
                                                    }
                                                }).then(res => {/*//console.log(res)*/ }).catch((error) => { 
                                                    addIDB("lastEventFailed", JSON.stringify(apiPayload))
                                                });
                                            }).catch((err) => {});
                                        } else {
                                            let payload = {
                                                eventName : dropOff,
                                                passportId: commonPayloadData[0] || '',
                                                profileID: commonPayloadData[1] || '',
                                                tenantId: commonPayloadData[2] || '',
                                                deviceId: commonPayloadData[3] || '',
                                                domainName: commonPayloadData[4] || '',
                                                sessionId: commonPayloadData[5] || '',
                                                data: {
                                                    u_email: '',
                                                    u_phoneNumber: ''
                                                }
                                            }

                                            // addIDB("log2", JSON.stringify(payload));
                                
        
                                            const option = {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(payload)
                                            }       
                                            
                                            let apiPayload = {
                                                ...option,
                                                "time" : new Date().toString()
                                            }

                                            getBaseUrl(Custom_Events).then(apiUrl =>{
                                                let apiRandId = Date.now();
                                                AddFailureApiDataToIndexDBSw(apiUrl,payload,apiRandId,"dropOffDataSw")
                                                fetch(apiUrl, option).then(res => {
                                                    if(res.ok){
                                                        addIDB("lastEventSuccess", JSON.stringify(apiPayload));
                                                        RemoveFailureApiDataFromIndexDBSw(apiRandId);
                                                        return res.json();
                                                    }
                                                }).then(res => {/*//console.log(res)*/ }).catch((error) => { 
                                                    addIDB("lastEventFailed", JSON.stringify(apiPayload))
                                                });
                                            }).catch((err) => {});
                                        }
    
                                    }).catch(err => {
                                        let payload = {
                                            eventName : dropOff,
                                            passportId: commonPayloadData[0] || '',
                                            profileID: commonPayloadData[1] || '',
                                            tenantId: commonPayloadData[2] || '',
                                            deviceId: commonPayloadData[3] || '',
                                            domainName: commonPayloadData[4] || '',
                                            sessionId: commonPayloadData[5] || '',
                                            data: {
                                                u_email: '',
                                                u_phoneNumber: ''
                                            }
                                        }

                                        // addIDB("log2", JSON.stringify(payload));
                            
    
                                        const option = {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        }       
                                        
                                        let apiPayload = {
                                            ...option,
                                            "time" : new Date().toString()
                                        }

                                        getBaseUrl(Custom_Events).then(apiUrl =>{
                                            let apiRandId = Date.now();
                                            AddFailureApiDataToIndexDBSw(apiUrl,payload,apiRandId,"dropOffDataSw")
                                            fetch(apiUrl, option).then(res => {
                                                if(res.ok){
                                                    addIDB("lastEventSuccess", JSON.stringify(apiPayload));
                                                    RemoveFailureApiDataFromIndexDBSw(apiRandId);
                                                    return res.json();
                                                }
                                            }).then(res => {/*//console.log(res)*/ }).catch((error) => { 
                                                addIDB("lastEventFailed", JSON.stringify(apiPayload))
                                            });
                                        }).catch((err) => {});
                                    });
                                }
                            } catch (error) {};
                            // addIDB("log1", "Inside Promise");
                            

                            // try {
                            //     let tenantID = res[2] || ''
                            //     if(tenantID == "bb073c1c_0589_4bc3_bb5d_eaf9ef5364e5" && data.data.data != "Appointment Booked") {
                            //         let dropOff = data.data.data + "_drop_off";
                            //         let campaignID;
                            //         let dynamicListID;
                            //         addIDB("dropOff", dropOff);
                            //         const payload = {
                            //             eventName : dropOff,
                            //             passportId: res[0] || '',
                            //             profileID: res[1] || '',
                            //             tenantId: res[2] || '',
                            //             deviceId: res[3] || '',
                            //             domainName: res[4] || '',
                            //             sessionId: res[5] || '',
                            //             data: {
                            //                 u_email: res[6] || "",
                            //                 u_phoneNumber: res[7] || ""
                            //             }
                            //         }

                            //         // try {
                            //         //     getIDB('u_email').then((res) => {
                            //         //         if(res.length){
                            //         //             payload.data['u_email'] = res;
                            //         //         }
                            //         //     }).catch(err => {
                            //         //         payload.data['u_email'] = ""}
                            //         //     );

                            //         //     getIDB('u_phoneNumber').then((res) => {
                            //         //         if(res.length) {
                            //         //             payload.data['u_phoneNumber'] = res;
                            //         //         }
                            //         //     }).catch(err => {
                            //         //         payload.data['u_phoneNumber'] = ""
                            //         //     });
                            //         // } catch (error) {
                            //         //     payload.data['u_email'] = "";
                            //         //     payload.data['u_phoneNumber'] = ""
                            //         // };

                            //         // payload.data = {
                            //         //     u_email: res[6] || '',
                            //         //     u_phoneNumber: res[7] || ''
                            //         // }
        
                            //         addIDB("log2", JSON.stringify(payload));
                                    
            
                            //         const option = {
                            //             method: 'POST',
                            //             headers: { 'Content-Type': 'application/json' },
                            //             body: JSON.stringify(payload)
                            //         }       
                                    
                            //         let apiPayload = {
                            //             ...option,
                            //             "time" : new Date()
                            //         }

                            //         getBaseUrl(Custom_Events).then(apiUrl =>{
                            //             let apiRandId = Date.now();
                            //             AddFailureApiDataToIndexDBSw(apiUrl,payload,apiRandId,"dropOffDataSw")
                            //             fetch(apiUrl, option).then(res => {
                            //                 if(res.ok){
                            //                     addIDB("lastEventSuccess", JSON.stringify(apiPayload));
                            //                     RemoveFailureApiDataFromIndexDBSw(apiRandId);
                            //                     return res.json();
                            //                 }
                            //             }).then(res => {/*//console.log(res)*/ }).catch((error) => { 
                            //                 addIDB("lastEventFailed", JSON.stringify(apiPayload))
                            //             });
                            //         }).catch((err) => {});

                            //     } else if(tenantID == "54b865b8_5123_461a_accf_d12ed01ce383") {
                            //         try {
                            //             addIDB("log1", "Inside else if");
                            //             Promise.all([getIDB('domain'), getIDB('visitedCount'), getIDB('uti_cid'), getIDB('uti_did'), getIDB('Res_Passport_Id'), getIDB('Res_Profile_Id')]).then(res =>{
                            //                 try {
                            //                     addIDB("log2", "Inside promise");
                            //                     const payload = {
                            //                         domain: res[0] || '',
                            //                         visitedCount: res[1] || '',
                            //                         campaignID: res[2] || '',
                            //                         dynamicListID: res[3] || '',
                            //                         passportId: res[4] || '',
                            //                         profileID: res[5] || '',
                            //                         tenantId: "camp_" +tenantID
                            //                     }
                            //                     addIDB("log3", JSON.stringify(payload));
                            //                     const option = {
                            //                         method: 'POST',
                            //                         headers: { 'Content-Type': 'application/json' },
                            //                         body: JSON.stringify(payload)
                            //                     }
                            //                     addIDB("log4", JSON.stringify(option));
                            //                     getBaseUrl(Web_SDK_Blast).then(apiUrl =>{
                            //                         addIDB("log5", `apiUrl: ${apiUrl}`);
                            //                         fetch(apiUrl, option).then(res => {
                            //                             let apiRandId = Date.now();
                            //                             AddFailureApiDataToIndexDBSw(url,payload,apiRandId,"utiDropOffDataSw")
                            //                             addIDB("log6", `Inside fetch: ${res}`)
                            //                             if(res.ok){
                            //                                 addIDB("log7", `Inside res.ok ${option}`);
                            //                                 addIDB("lastEventSuccess", JSON.stringify(option));
                            //                                 RemoveFailureApiDataFromIndexDBSw(option);
                            //                             }
                            //                             // res.json()   
                            //                         }).then(res => { console.log(res);
                            //                             //  return res; 
                            //                         }).catch((error) => { 
                            //                             addIDB("lastEventFailed", JSON.stringify(option))
                            //                         })
                            //                     })
                            //                 } catch (error) {};
                            //             });
                            //         } catch (error) {};
                            //     }
                            // } catch (error) { }
                    }).catch(err => {});
                }
            } catch (error) {};
        } else if("utiEvent" == data.data.event) {
            flag = true;
        }
    }
});


self.addEventListener('push', (event) => {
    try {
        if(flag == true && event.data) {
            try {
                flag = false;
                let notificationData = JSON.parse(event.data.text());
                addIDB("notificationData", notificationData);
                representNotification(notificationData);
            } catch (error) {}
        }
    } catch (error) {};
})



const representNotification = (data) => {
    //console.log('representing');
    //console.log(data);
    const title = data.data.data.title;
    let optionsData;
    if(typeof data.data.options == 'string') {
        optionsData = JSON.parse(data.data.options);
    } else {
        optionsData = typeof data.data.data.options == "object"? data.data.data.options : JSON.parse(data.data.data.options);
    }
    let options = { body: data.data.data.body, ...optionsData };
    msgId = data.data.data.id;  
    //console.log(JSON.parse(data.data.data.options).url);
    //console.log(options);
    button_actions = options.actions;
    actions = "click_actions" in data.data.data ? data.data.data.click_actions : data.data.data.click_action;
    //console.log("click_actions: " + actions);
    const notificationExpiryDate = data.data.data.ttl;
    console.log(notificationExpiryDate);
    checkExpired(title, options, notificationExpiryDate, msgId, actions)
}

function checkExpired(title, options, notificationExpiryDate, msgId, actions) {
    //console.log(notificationExpiryDate);
    //console.log('validating notification...!');
    const utc_date = new Date(new Date().toUTCString()).toISOString().split(".")[0];
    if (!!notificationExpiryDate && (new Date(utc_date) >= new Date(notificationExpiryDate))) {
        console.log('Notification Expired');
        var option = {
            action: 'expired',
            status_code: '1',
            isConversion: "false",
            smartCode: ""
        }
    } else {
        presentNotification(title, options, actions, msgId);
        var option = {
            action: 'received',
            status_code: '5',
            isConversion: "false",
            smartCode: ""
        }
        respondToServer(option, msgId);
        //console.log('Notification presented');
    }
}

function presentNotification(title, options, actions, msgId) {
    // options["tag"] = new URL(actions || self.location.origin).pathname;
    options["tag"] = msgId;
    options["data"] = options;
    options["showInAppNotification"] = "false";
    //console.log('presentNotification called', title, options);
    self.registration.showNotification(title, options);
}

// Retrieve an instance of Firebase Messaging so that it can handle background
//messages.

//Initialize the Firebase app in the service worker by passing in the
//messagingSenderId.
firebase.initializeApp({ "messagingSenderId": "537523308807" });

var messaging = firebase.messaging();
var dataforlater = null;

messaging.setBackgroundMessageHandler(function (payload) {
    dataforlater = payload;
    //console.log('received bg', JSON.stringify(dataforlater));
    //console.log('BG payload', payload);
    function storeNotifications(payload) {
        try {
            getIDB('ResNotification').then(r => {
                // r = r.value;
                //console.log('ResNotification', r);
                if (r.length > 14) {
                    r.shift();
                    r.push(payload)
                } else {
                    r.push(payload)
                }
                addIDB('ResNotification', r);
            }, er => {
                addIDB('ResNotification', [payload]);
            });
        } catch (err) {
            //console.log('storeNotifications err', err);
        }
    }
    storeNotifications(payload);
    if ('data' in payload) {
        return showBgNotification(dataforlater);
    } else {
        return new Promise(function (res, rej) { });
    }
});

function showBgNotification(payload) {
    //console.log('showBgNotification', payload)
    if (payload.data.resul) {
        payload.data = JSON.parse(atob(payload.data.resul.substring(4)))
        // //console.log('payload',payload)
        if (!!payload.data.resul) {
            payload.data = JSON.parse(atob(payload.data.resul.substring(4)));
            // //console.log('payload2',payload)
        }
        payload.data.options = JSON.stringify(payload.data.options)
    }
    // //console.log('showBgNotification atob',payload)
    if (!!payload.data && !!payload.data.ttl && payload.data.ttl == "0001-01-01T00:00:00") {
        payload.data.ttl = ''
    }
    if (!!payload.data && !!payload.data.ttl) {
        const notificationExpiryDate = payload.data.ttl;
        const utc_date = new Date(new Date().toUTCString()).toISOString().split(".")[0];
        if (new Date(utc_date) >= new Date(notificationExpiryDate)) {
            console.log('notification expired!', payload);
            var option = {
                action: 'expired',
                status_code: '1'
            }
            return new Promise(function (res, rej) { });
        }
    }
    //console.log('payload.data.options', payload.data.options);
    const notificationOptions = JSON.parse(payload.data.options);
    // notificationOptions['tag'] = new URL(payload.data.click_actions || self.location.origin).pathname;
    notificationOptions['tag'] = payload.data.id;
    //console.log('notificationOptions', notificationOptions);
    if (notificationOptions.type == "image") {
        notificationOptions["image"] = notificationOptions.url;
    }
    button_actions = notificationOptions.actions;
    const notificationTitle = payload.data.title;
    notificationOptions["data"] = {
        showInAppNotification: payload.data.inAppNotification,
        representNotificationData: payload.data
    };
    //console.log('notificationOptions', notificationOptions);
    var option = {
        action: 'received',
        status_code: '5',
        isConversion: "false",
        smartCode: ""
    };
    msgId = payload.data.id;
    respondToServer(option, payload.data.id);
    return self.registration.showNotification(notificationTitle, notificationOptions);
}

function RetryFailureNotification(){
    getIDB("Res_Sdk_Failure_Api_List").then(res =>{
        ConsoleLog(res)
        if(res && res.length){     
            ConsoleLog("Res_Sdk_Failure_Api_List:" + JSON.stringify(res))
            let currentApiData = [...res];   
            
            const groups = currentApiData.reduce((groups, item) => {
                const group = (groups[item.apiName] || []);
                group.push(item);
                groups[item.apiName] = group;
                return groups;
              }, {});
              let clicks = [];
              let events = [];
              let payload = {};
              let rowIdList   = [];
              let option = {};
              let apiUrl = ""; 
              Object.keys(groups).forEach(item =>{ 
                groups[item].forEach(apiItem =>{
                  const {rowId,url,bodyContent:{action,status_code,id,passportId,profileID,tenantId,domainName,status,deviceId,eventName,pageUrl,sessionId},apiName}  = apiItem;  
                  const {bodyContent} = apiItem;
                    if(apiName == "inAppNotificationTracking"){
                      clicks = [...clicks,{action,id,status}];
                      payload = {passportId,profileID,tenantId,domainName,clicks};   
                    }else if(apiName == "custEvent"){
                        events = [...events,{eventName,pageUrl,sessionId,domainName}];
                        payload = {passportId,profileID,tenantId,domainName,deviceId,events};   
                      }else{
                        payload = bodyContent;
                      }
                    rowIdList = [...rowIdList,rowId];
                    apiUrl = url;
                })                                            
                option = {
                    method: 'POST',                    
                    body: JSON.stringify(payload)                  
                }                
            
                fetch(apiUrl, option).then(res => { return res.json();}).then(res => {
                    if(res.status == true){
                        let updateDataToDb = currentApiData.filter(deleteItem => !rowIdList.includes(deleteItem.rowId))  
                        addIDB("Res_Sdk_Failure_Api_List",updateDataToDb);
                    }
                }).catch(err =>{
                    ConsoleLog("addDBErr", err)
                })
            })
           
        }else{
            ConsoleLog("api-retry-sw-data-not-found")
        }
    }).catch(err =>{
        ConsoleLog("api-retry-sw-err", err)
    })
}

function checkDropOffData() {
    try {
        getIDB('dropOffData').then(res => {
            if(res.length) {
                try {
                    let data = JSON.parse(res);
                    Promise.all([getIDB('Res_Passport_Id'), getIDB('Res_Profile_Id'), getIDB('_tenantId'), getIDB('deviceId')]).then(res => {
                        try {
                            const payload = {
                                ...data,
                                passportId: res[0] || '',
                                profileID: res[1] || '',
                                tenantId: res[2] || '',
                                deviceId: res[3] || ''
                            }
                            const option = {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            }                  
                            
                            //fetch(getBaseUrl(Custom_Events), option).then(res => res.json()).then(res => {/*//console.log(res)*/ });
                            getBaseUrl(Custom_Events).then(apiUrl =>{
                                let apiRandId      = Date.now();
                                AddFailureApiDataToIndexDBSw(apiUrl,payload,apiRandId,"dropOffDataSw")
                                    fetch(apiUrl, option).then(res => {
                                    if(res.ok){
                                        RemoveFailureApiDataFromIndexDBSw(apiRandId)
                                        addIDB("dropOffData", "");
                                        let payload = {
                                            ...option,
                                            ...res,
                                            "dropOffDataSuccess" : true
                                        }
                                        addIDB("dropOffDataSuccess", JSON.stringify(payload));
                                        return res.json();
                                    }
                                }).then(res => {/*//console.log(res)*/ });
                            })
                        } catch (error) { }
                    })
                } catch (error) {};
            }
        }).catch(err => {
            ConsoleLog("Error occurred");
        });
    } catch (error) {};
}


function ConsoleLog(key,value=''){
    getIDB("swDebugEnable").then(res =>{

        if(res == true){
            console.log("swdebug enabled")
            console.log(`${key} ::: ${value}`)
        }
    }).catch(err=>{
        console.log("swdebug disabled")
    })
}


function AddFailureApiDataToIndexDBSw(url,apiContent,apiRandId,type){
    getIDB("Res_Sdk_Failure_Api_List").then(res=>{
      if(res && res.length){     
        let currentApiData = [{rowId:apiRandId,url:url,bodyContent:apiContent,status:true,apiName:type}];
        currentApiData = [...currentApiData,...res];
        addIDB("Res_Sdk_Failure_Api_List",currentApiData);
        ConsoleLog("Res_Sdk_Failure_Api_List:" + JSON.stringify(currentApiData))
      }
    }).catch(err=>{          
        let currentApiData = [{rowId:apiRandId,url:url,bodyContent:apiContent,status:true,apiName:type}];
        addIDB("Res_Sdk_Failure_Api_List",currentApiData);
        ConsoleLog("Res_Sdk_Failure_Api_List:" + JSON.stringify(currentApiData))
    })  
  }
  function RemoveFailureApiDataFromIndexDBSw(apiRandId){
    getIDB("Res_Sdk_Failure_Api_List").then(res=>{
      if(res && res.length){     
        ConsoleLog("Res_Sdk_Failure_Api_List:" + JSON.stringify(res))
        let currentApiData = [...res];    
        currentApiData = currentApiData.filter(item => item.rowId!==apiRandId)  
        addIDB("Res_Sdk_Failure_Api_List",currentApiData);
      }
    }).catch(err=>{    
        ConsoleLog('Res_Sdk_Failure_Api_List: not found id:'+apiRandId)    
    }) 
  }