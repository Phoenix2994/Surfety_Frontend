chrome.extension.sendMessage({}, function(response)
{
	var readyStateCheckInterval = setInterval(function()
	{
		if (document.readyState === "complete")
		{
			clearInterval(readyStateCheckInterval);
			// ----------------------------------------------------------
			// This part of the script triggers when page is done loading
			console.log("Surfety: Hello. This message was sent from scripts/inject.js");
			// ----------------------------------------------------------

			// examples of how to write and read from chrome persistent storage
			
			// var oauth_token = "token";
			// chrome.storage.sync.set({"surfety_oauth_access_token":oauth_token}, function()
			// {
      //     console.log('Value is set to ' + oauth_token);
			//
			// 		chrome.storage.sync.get(['surfety_oauth_access_token'], function(storage)
			// 		{
			// 			console.log('surfety_oauth_access_token currently is ' + storage.surfety_oauth_access_token);
			// 		});
      // });
		}
	}, 10);
});
