document.addEventListener("DOMContentLoaded", ()=>{
	let ele = document.querySelectorAll("script[src$=sdk]");
	if(ele.length){
		ele.forEach((item)=>{
			item.remove();
		})
	}
	let script = document.createElement('script');
	script.setAttribute("defer","defer");
	script.src="https://sdk.smartdx.co/handlers/71c84f9ce6284198ba899b79d530e9db.sdk";
	script.setAttribute("fcm_service_path","firebase-messaging-sw-input.js");
    document.head.appendChild(script);
})
