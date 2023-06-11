document.addEventListener("DOMContentLoaded", ()=>{
	let ele = document.querySelectorAll("script[src$=sdk]");
	if(ele.length){
		ele.forEach((item)=>{
			item.remove();
		})
	}
	let script = document.createElement('script');
	script.setAttribute("defer","defer");
	script.src="https://sdk.smartdx.co/handlers/34e3ef439dbd47ebb6151e2970f596a7.sdk";
	script.setAttribute("fcm_service_path","firebase-messaging-sw.js");
    document.head.appendChild(script);
})