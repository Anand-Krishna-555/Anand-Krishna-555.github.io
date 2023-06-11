document.addEventListener("DOMContentLoaded", ()=>{
	let ele = document.querySelectorAll("script[src$=sdk]");
	if(ele.length){
		ele.forEach((item)=>{
			item.remove();
		})
	}
	let script = document.createElement('script');
	script.setAttribute("defer","defer");
	script.src="https://anand-krishna-555.github.io/ServerPath.github.io/handlers/f4f0811b658c45e794322f307b93c235.js";
	script.setAttribute("fcm_service_path","firebase-messaging-sw.js");
    document.head.appendChild(script);
	window.ReWebSDKConfig = {
		"customFileBase" : "https://anand-krishna-555.github.io/ServerPath.github.io"
	}

	// var resulSdk = document.createElement('script')
	// resulSdk.type = 'text/javascript';
	// resulSdk.src = 'http://127.0.0.1:5500/common/handlers/bb073c1c05894bc3bb5deaf9ef5364e5.js'

	// resulSdk.defer = true
	// document.head.appendChild(resulSdk)
})
