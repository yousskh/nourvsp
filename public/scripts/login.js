let socket = io();
let key = getWithExpiry("authkey");
if (key) {
    window.location.href = "/admin?authkey=" + key;
}

var form = document.getElementById("loginForm");
form.addEventListener('submit', handleForm);
function handleForm(event) { event.preventDefault();
    let usr = document.getElementById("username").value;
    let pwd = document.getElementById("password").value;
    socket.emit("checkCredentials", [usr, pwd], function(err, responseData) {
        if (err) {
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            document.getElementById("error").style.display = "block";
            document.getElementById("error").textContent = err;
        } else {
            setWithExpiry("authkey", responseData[1], 1800000);
            window.location.href = `/${responseData[0]}?authkey=` + responseData[1];
        }
    });
}

function setWithExpiry(key, value, ttl) {
    const now = new Date()
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {

        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}