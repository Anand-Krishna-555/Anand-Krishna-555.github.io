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
})
