var readyStateCheckInterval = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    // Debug only
    // btn_clean.addEventListener('click', function()
    // {
    //   if(confirm("Are you sure?"))
    //   {
    //     chrome.storage.sync.clear();
    //     location.reload();
    //   }
    // });
 
    chrome.storage.sync.get(['surfety_user_state'], function (storage) {
      if (storage.surfety_user_state) {
        switch (storage.surfety_user_state) {
          case 'registered':
          case 'logged_out':
            console.log('login popup');
            document.getElementById("SurfetyPopup").style.height = "305px";
            document.getElementById('register').style.display = 'none';
            //document.getElementById('login').style.display='';
            $("#login").fadeIn(375);
            document.getElementById('logout').style.display = 'none';
            btn_login.addEventListener('click', function () {
              btn_login.disabled = true;
              surfety.login();
            });
            btn_goto_register.addEventListener('click', function () {
              btn_login.disabled = true;
              btn_goto_register.disabled = true;
              chrome.storage.sync.remove(['surfety_user_state'], function () {
                console.log('user state: goto_register');
                location.reload();
              });
            });
            break;
          case 'logged_in':
            console.log("logout popup");
            document.getElementById('register').style.display = 'none';
            document.getElementById('login').style.display = 'none';
            //document.getElementById('logout').style.display='';
            document.getElementById("SurfetyPopup").style.height = "215px";
            $("#logout").fadeIn(375);
            document.getElementById('btn_logout').addEventListener('click', function () {
              btn_logout.disabled = true;
              surfety.logout();
            });
            document.getElementById('btn_dashboard').addEventListener('click', function () {
              chrome.tabs.create({ url: "https://api.surfety.it/api/dashboard?page=1" });
            });
            break;
        }
      }
      else {
        console.log("register popup");
        //document.getElementById('register').style.display='';
        document.getElementById("SurfetyPopup").style.height = "325px";
        $("#register").fadeIn(375);
        document.getElementById('login').style.display = 'none';
        document.getElementById('logout').style.display = 'none';
        btn_register.addEventListener('click', function () {
          btn_register.disabled = true;
          console.log('btn_register');
          surfety.register();
        });
        btn_goto_login.addEventListener('click', function () {
          btn_register.disabled = true;
          btn_goto_login.disabled = true;
          console.log('btn_goto_login');
          chrome.storage.sync.set({ 'surfety_user_state': 'registered' }, function () {
            console.log('user state: goto_login');
            window.location.reload();
          });
        });
      }
    });
  }
}, 10);

var surfety =
{
  register: function () {
    var data =
    {
      email: document.getElementById('txt_register_email').value,
      password: document.getElementById('txt_register_password').value,
      password_confirmation: document.getElementById('txt_register_password_confirmation').value
    };
    console.log(data);
    var isEmailValid = (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email));
    if (!isEmailValid) {
      btn_register.style.display = 'none';
      btn_goto_login.style.display = 'none';
      btn_register.disabled = false;
      invalid_email_address.style.display = '';
      setTimeout(function () {
        invalid_email_address.style.display = 'none';
        btn_goto_login.style.display = '';
        btn_register.style.display = '';
      }, 2500);
    }
    else {
      if (data.password.length < 6 && data.password_confirmation.length < 6) {
        btn_register.style.display = 'none';
        btn_goto_login.style.display = 'none';
        btn_register.disabled = false;
        password_too_short.style.display = '';
        setTimeout(function () {
          password_too_short.style.display = 'none';
          btn_register.style.display = '';
          btn_goto_login.style.display = '';
        }, 2500);
        return;
      }
      else
        if (data.password && data.password_confirmation) {
          if (data.password === data.password_confirmation) {
            if (data.password.length < 6) {
              btn_register.style.display = 'none';
              btn_goto_login.style.display = 'none';
              btn_register.disabled = false;
              password_too_short.style.display = '';
              setTimeout(function () {
                password_too_short.style.display = 'none';
                btn_register.style.display = '';
                btn_goto_login.style.display = '';
              }, 2500);
              return;
            }
            else {
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
                if (XHR.readyState == 4 && (XHR.status == '200' || XHR.status == '201')) {
                  // status: 200 | error response: {"headers":[],"original":["The email has already been taken."],"exception":null}
                  // status: 201 | success response: {"email":"mattmatt_10@gmail.com","updated_at":{"date":"2018-09-14 06:50:20.000000","timezone_type":3,"timezone":"UTC"},"created_at":{"date":"2018-09-14 06:50:20.000000","timezone_type":3,"timezone":"UTC"},"id":8}
                  var response = JSON.parse(XHR.responseText);
                  console.log('response: ' + XHR.responseText);
                  if (response.original && response.original == "The email has already been taken.") {
                    // KO: user already taken
                    btn_register.style.display = 'none';
                    btn_goto_login.style.display = 'none';
                    btn_register.disabled = false;
                    email_already_taken.style.display = '';
                    setTimeout(function () {
                      email_already_taken.style.display = 'none';
                      btn_register.style.display = '';
                      btn_goto_login.style.display = '';
                    }, 2500);
                  }
                  else
                    if (response.email == data.email && response.id) {
                      // OK: proceed with user registration
                      chrome.storage.sync.set({ 'surfety_user_state': 'registered' }, function () {
                        console.log('user state: registered');
                        btn_register.style.display = 'none';
                        btn_goto_login.style.display = 'none';
                        registration_successful.style.display = '';
                        setTimeout(function () {
                          window.location.reload();
                        }, 2500);
                      });
                    }
                }
                else {
                  console.error(XHR.responseText);
                }
              };
              // Set up our request
              XHR.open('POST', 'http://api.surfety.it/api/users/register');
              // Add the required HTTP header for form data POST requests
              XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
              // Finally, send our data.
              XHR.send(urlEncodedData);
            }
          }
          else {
            btn_register.style.display = 'none';
            btn_goto_login.style.display = 'none';
            btn_register.disabled = false;
            passwords_dont_match.style.display = '';
            setTimeout(function () {
              passwords_dont_match.style.display = 'none';
              btn_register.style.display = '';
              btn_goto_login.style.display = '';
            }, 2500);
          }
        }
        else {
          console.log('Oops! Invalid registration data');
          btn_register.style.display = 'none';
          btn_goto_login.style.display = 'none';
          btn_register.disabled = false;
          passwords_dont_match.style.display = '';
          setTimeout(function () {
            passwords_dont_match.style.display = 'none';
            btn_register.style.display = '';
            btn_goto_login.style.display = '';
          }, 2500);
        }
    }
  },
  login: function () {
    var data =
    {
      email: document.getElementById('txt_login_email').value,
      password: document.getElementById('txt_login_password').value
    };
    console.log(data);
    if (data.email && data.password) {
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
        if (XHR.readyState == 4 && XHR.status == '200') {
          var response = JSON.parse(XHR.responseText);
          if (response.original && response.original == "The credentials entered are not correct, please try again.") {
            console.log('Oops! Bad email or password');
            btn_login.style.display = 'none';
            btn_goto_register.style.display = 'none';
            btn_login.disabled = false;
            invalid_login_credentials.style.display = '';
            setTimeout(function () {
              invalid_login_credentials.style.display = 'none';
              btn_login.style.display = '';
              btn_goto_register.style.display = '';
            }, 2500);
          } else {
            var response = JSON.parse(XHR.responseText);
            console.log('response: ' + XHR.responseText);
            chrome.storage.sync.set({ 'surfety_oauth_access_token': response.access_token }, function () {
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
                location.reload();
              });
            });
          }
        }
        else {
          console.error(XHR.responseText);
          btn_login.style.display = 'none';
          btn_goto_register.style.display = 'none';
          btn_login.disabled = false;
          invalid_login_credentials.style.display = '';
          setTimeout(function () {
            invalid_login_credentials.style.display = 'none';
            btn_login.style.display = '';
            btn_goto_register.style.display = '';
          }, 2500);
        }
      };

      // Set up our request
      XHR.open('POST', 'http://api.surfety.it/api/users/login');
      // Add the required HTTP header for form data POST requests
      XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      // Finally, send our data.
      XHR.send(urlEncodedData);

    } else {
      console.log('Oops! Bad email or password');
      btn_login.style.display = 'none';
      btn_goto_register.style.display = 'none';
      btn_login.disabled = false;
      invalid_login_credentials.style.display = '';
      setTimeout(function () {
        invalid_login_credentials.style.display = 'none';
        btn_login.style.display = '';
        btn_goto_register.style.display = '';
      }, 2500);
    }
  },
  refresh: function () {
    return new Promise(function (resolve, reject) {
      chrome.storage.sync.get(['surfety_oauth_refresh_token'], function (storage) {
        if (storage.surfety_oauth_refresh_token) {
          console.log('current surfety_oauth_refresh_token: ' + storage.surfety_oauth_refresh_token);
          var data =
          {
            refresh_token: storage.surfety_oauth_refresh_token
          };
          console.log(data);
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
              if (response.original && response.original == "Oauth token is null or invalid.") {
                console.log("oauth token is null or invalid");
                chrome.storage.sync.set({ 'surfety_user_state': 'logged_out' }, function () {
                  console.log('user state: logged_out');
                  console.log('logged_out in surfety.core@refresh1');
                  reject("oauth token is null or invalid");
                  //location.reload();
                });
              } else {
                var response = JSON.parse(XHR.responseText);
  
                chrome.storage.sync.set({ 'surfety_oauth_access_token': response.access_token }, function () {
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
                    resolve(true);
                    //location.reload();
                  });
                });
              }
            } else {
              
              chrome.storage.sync.set({ 'surfety_user_state': 'logged_out' }, function () {
                console.log('oauth token is null or invalid');
                reject('oauth token is null or invalid');
              });
            }
          };
          // Set up our request
          XHR.open('POST', 'https://api.surfety.it/api/users/login/refresh');
          // Add the required HTTP header for form data POST requests
          XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          // Finally, send our data.
          XHR.send(urlEncodedData);
        } else {
          
          chrome.storage.sync.set({ 'surfety_user_state': 'logged_out' }, function () {
            console.log('There is no refresh_token in the storage or is null');
            console.log('logged_out in surfety.core@refresh2');
            reject('There is no refresh_token in the storage or is null');
          });
        }
      })
    }).catch((err) => {
      console.log(err);
    });
  },

  logout: function () {
    chrome.storage.sync.get(['surfety_oauth_access_token', 'surfety_oauth_exp_date'], async function (storage) {
      if (storage.surfety_oauth_access_token && storage.surfety_oauth_exp_date) {
        now = new Date();
        exp_date = new Date(storage.surfety_oauth_exp_date);
        //check token expiration, if false refresh
        if (now < exp_date) {
          console.log('current surfety_oauth_access_token: ' + storage.surfety_oauth_access_token);
          var data =
          {
            access_token: storage.surfety_oauth_access_token
          };
          console.log(data);
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
            if (XHR.readyState == 4 && XHR.status == '200') {
              var response = JSON.parse(XHR.responseText);
              if (response.original && response.original == "Logout did not work as expected.") {
                console.log("oauth token is null or invalid");
                chrome.storage.sync.set({ 'surfety_user_state': 'logged_out' }, function () {
                  console.log('user state: logged_out');
                  console.log('logged_out in surfety.core@logout1');
                  location.reload();
                });
              } else {
                var response = JSON.parse(XHR.responseText);
                console.log('response: ' + XHR.responseText);
                chrome.storage.sync.get(['surfety_oauth_access_token'], function (storage) {
                  console.log(storage);
                  chrome.storage.sync.set({ 'surfety_user_state': 'logged_out' }, function () {
                    console.log('user state: logged_out');
                    console.log('logged_out in surfety.core@logout2');
                    location.reload();
                  });
                });
              }
            }
            else {
              console.error(XHR.responseText);
            }
          };
          // Set up our request
          XHR.open('POST', 'http://api.surfety.it/api/users/logout');
          // Add the required HTTP header for form data POST requests
          XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          // Finally, send our data.
          XHR.send(urlEncodedData);
        } else {
          const result = await surfety.refresh();
          if (result) { surfety.logout(); }
					else {
						console.error('oauth token is null or invalid');
					}
        }
      }
      else { console.error('oauth token is null or invalid'); }
    });
  }
};

// json data fetching
surfety.comparators =
  {
    privacy_policy: [],
    keyword: [],
    data: []
  };
// fetch privacy_policy.csv -> privacy_policy.json
fetch(chrome.extension.getURL('/json/privacy_policy.json')).then((resp) => resp.json()).then(function (jsonData) {
  surfety.comparators.privacy_policy = jsonData;
});
// fetch keyword.csv -> keyword.json
fetch(chrome.extension.getURL('/json/keyword.json')).then((resp) => resp.json()).then(function (jsonData) {
  surfety.comparators.keyword = jsonData;
});
fetch(chrome.extension.getURL('/json/data.json')).then((resp) => resp.json()).then(function (jsonData) {
  surfety.comparators.data = jsonData;
});

