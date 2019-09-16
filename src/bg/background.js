// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

//example of using a message handler from the inject scripts
var access_token = null;
var exp_date = null;
var refresh_token = null;

chrome.storage.onChanged.addListener(
  function (changes, storage) {
    if (storage == "sync" && changes.surfety_oauth_access_token) {
      access_token = changes.surfety_oauth_access_token.newValue;
      console.log("access token in storage", access_token);
    } else if (storage == "sync" && changes.surfety_oauth_refresh_token) {
      refresh_token = changes.surfety_oauth_refresh_token.newValue;
      console.log("refresh token in storage", refresh_token);
    } else if (storage == "sync" && changes.surfety_oauth_exp_date) {
      exp_date = changes.surfety_oauth_exp_date.newValue;
      console.log("exp date in storage", exp_date);
    }
  }
)

chrome.extension.onMessage.addListener
  (
    function (request, sender, sendResponse) {
      chrome.storage.sync.get(['surfety_oauth_access_token', 'surfety_oauth_refresh_token', 'surfety_oauth_exp_date'], function (storage) {
        access_token = storage.surfety_oauth_access_token;
        refresh_token = storage.surfety_oauth_refresh_token;
        exp_date = storage.surfety_oauth_exp_date;
      });
      /*
      chrome.tabs.executeScript(null,
        {file:"https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.6/lunr.min.js"});*/
      chrome.pageAction.show(sender.tab.id);
      sendResponse();
    }
  );

// used to get privacy content from different page
chrome.extension.onRequest.addListener(
  function (message, sender, sendResponse) {
    fetch(message).then(r => {
      r.text().then(result => {
        sendResponse(result)
      });
      // Result now contains the response text, do what you want...
    })
  });


chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    var token = {
      name: "Authorization",
      value: "Bearer " + access_token
    }
    // handle refresh_token
    console.log(exp_date);
    now = new Date();
    date = new Date(exp_date);

    console.log(now, date);
    if (now < date) {
      details.requestHeaders.push(token);
      return { requestHeaders: details.requestHeaders };
    } else {
      // in questo modo viene rifatta la chiamata con i parametri corretti 
      // ma per un momento viene mostrato pagina bloccata
      refresh();
      return { cancel: true };
    }
  },
  { urls: ['https://api.surfety.it/api/dashboard*'] },
  ['blocking', 'requestHeaders']
);

function refresh() {
  chrome.storage.sync.get(['surfety_oauth_refresh_token'], function (storage) {
    if (storage.surfety_oauth_refresh_token) {
      console.log('current surfety_oauth_refresh_token: ' + storage.surfety_oauth_refresh_token);
      var data =
      {
        refresh_token: storage.surfety_oauth_refresh_token
      };
      var XHR = new XMLHttpRequest();
      var urlEncodedData = '';
      var urlEncodedDataPairs = [];
      // Turn the data object into an array of URL-encoded key/value pairs.
      for (var name in data) { urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name])); }
      // Combine the pairs into a single string and replace all %-encoded spaces to
      // the '+' character; matches the behaviour of browser form submissions.
      urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
      // Define what happens on successful data submission
      XHR.addEventListener('load', function (event) {
        console.log('Yeah! Data sent and response loaded.');
      });
      // Define what happens in case of error
      XHR.addEventListener('error', function (event) {
        console.error('Oops! Something goes wrong.');
      });
      // Define response callback
      XHR.onload = function () {
        console.log(XHR.status);
        if (XHR.readyState == 4 && XHR.status == '200') {
          var response = JSON.parse(XHR.responseText);
          console.log(response);
          if (response.original && response.original == "Oauth token is null or invalid.") {
            console.log("oauth token is null or invalid");
            chrome.storage.sync.set({ 'surfety_user_state': 'logged_out' }, function () {
              console.log('user state: logged_out');
              console.log('logged_out in background@refresh1');
            });
          } else {
            var response = JSON.parse(XHR.responseText);
            console.log('response: ' + XHR.responseText);
            chrome.storage.sync.set({ 'surfety_oauth_access_token': response.access_token }, function () {
              chrome.tabs.update({ url: "https://api.surfety.it/api/dashboard" });
              console.log('oauth access token is set to ' + response.access_token);
              var now = new Date();
              var seconds = response.expires_in;
              now.setTime(now.getTime() + (seconds * 1000));
              chrome.storage.sync.set({ 'surfety_oauth_exp_date': now.toUTCString() }, function () {
                console.log('oauth expiration date is set to ' + now.toUTCString());
              });
              chrome.storage.sync.set({ 'surfety_oauth_refresh_token': response.refresh_token }, function () {
                console.log('oauth refresh token is set to ' + response.refresh_token);
              });
              chrome.storage.sync.set({ 'surfety_user_state': 'logged_in' }, function () {
                console.log('user state: logged_in');
              });
            });
          }
        }
      };
      // Set up our request
      XHR.open('POST', 'http://api.surfety.it/api/users/login/refresh');
      // Add the required HTTP header for form data POST requests
      XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      // Finally, send our data.
      XHR.send(urlEncodedData);
    } else {
      console.log('refresh token is null or invalid');
    }
  });
}