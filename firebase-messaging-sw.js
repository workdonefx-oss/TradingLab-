importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);


firebase.initializeApp({

  apiKey:
    "AIzaSyCm70WCFu7tP-PwsVfyYuurcAQEAHpZz28",

  authDomain:
    "tradelab-5c0d4.firebaseapp.com",

  databaseURL:
    "https://tradelab-5c0d4-default-rtdb.firebaseio.com",

  projectId:
    "tradelab-5c0d4",

  storageBucket:
    "tradelab-5c0d4.firebasestorage.app",

  messagingSenderId:
    "810630896597",

  appId:
    "1:810630896597:web:41f8cbda8a1261e17d7b5c"

});


const messaging =
  firebase.messaging();


messaging.onBackgroundMessage(
  function(payload) {

    console.log(
      "Background message:",
      payload
    );


    const notificationTitle =
      payload.notification?.title ||
      "TradeLab";


    const notificationOptions = {

      body:
        payload.notification?.body ||
        "You have a new chat message.",

      icon:
        "/icon-192.png",

      badge:
        "/icon-192.png",

      data:
        payload.data || {}

    };


    self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );

  }
);


self.addEventListener(
  "notificationclick",
  function(event) {

    event.notification.close();


    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(function(clientList) {

        for (
          const client of clientList
        ) {

          if ("focus" in client) {

            return client.focus();

          }

        }


        if (clients.openWindow) {

          return clients.openWindow(
            "/"
          );

        }

      })

    );

  }
);