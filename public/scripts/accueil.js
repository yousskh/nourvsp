let socket = io();

preSettings()
function preSettings() {
    addPagesEvent();
    //checkLogin();
    refreshPage("presentation-page");

    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)) {
        document.getElementById("main-frame").style.display = "none";
        document.getElementById("use-error").style.display = "flex";
    } else {
        if (window.screen.height < 800) {
            document.getElementById("avertissement-div").style.display = "flex";
        }
    }
}

function addPagesEvent() {
    let pagesButton = document.querySelectorAll(".petit-titre");
    for (let i = 0; i < pagesButton.length; i++) {
        pagesButton[i].addEventListener("click", function () {
            refreshPage(pagesButton[i].id + "-page");
        });
    }
}

function refreshPage(page) {
    document.getElementById("presentation-page").style.display = "none";
    document.getElementById("actus-page").style.display = "none";
    document.getElementById("contact-page").style.display = "none";
    document.getElementById("apropos-page").style.display = "none";
    document.getElementById(page).style.display = "flex";
}

document.getElementById("login").addEventListener("click", function () {
    document.location.href = "login";
})

/*document.getElementById("logout").addEventListener("click", function () {
    document.location.href = "logout";
})

socket.on("authcheck", function (data) {
    alert(data);
});

function checkLogin() {
    socket.emit("checkLogin", {}, function(err, responseData) {
        if (err === null) {
            if (responseData) {
                document.getElementById("droite-entete").innerHTML = "";
                let dashboard = document.createElement("button");
                dashboard.textContent = "Menu";
                dashboard.id = "dashboard";
                dashboard.className = "top-button";
                document.getElementById("droite-entete").appendChild(dashboard);
            }
        }
    });
}*/