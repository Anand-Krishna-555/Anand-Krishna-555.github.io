window.addEventListener('message', function(event) {
    console.log("ORIGIN IS " + event.origin);
    console.log("DATA IS " + event.data);
    let data = event.data;
    document.cookie = data.key + '=' + data.value + '; path=/';
});
