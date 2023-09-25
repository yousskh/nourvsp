let appVersion = '2.0.1'
let dateLastUpdate = '26/09/2023'


const navBar = document.querySelector("nav"),
    menuBtns = document.querySelectorAll(".menu-icon"),
    overlay = document.querySelector(".overlay");
menuBtns.forEach((menuBtn) => {
    menuBtn.addEventListener("click", () => {
        navBar.classList.toggle("open");
    });
});
overlay.addEventListener("click", () => {
    navBar.classList.remove("open");
});

let socket = io();

let moreListInfos = false;
let key = getWithExpiry("authkey");
const openingTime = new Date();

preSettings()
function preSettings() {
    if (key) {

        socket.emit("queryAuth", key, function (err, responseData) {
            if (err || responseData === "0") {
                localStorage.removeItem("authkey");
                window.location.href = "/";
            }
        });

        socket.emit("getPermissionLevel", key, function (err, responseData) {
            if (err) {
                alert(err);
            } else {
                document.getElementById("loggedUsername").textContent = `Connecté en tant que : ${responseData[1]}`;
                switch (responseData[0]) {
                    case "9":
                        document.getElementById("dvpMenu").style.display = "block";
                        document.getElementById("b-users").style.display = "block";
                        document.getElementById("param-avances").style.display = "block";
                        break;
                    case "8":
                        document.getElementById("param-avances").style.display = "block";
                        break;
                    default:
                        break;
                }
            }
        });

    } else {
        window.location.href = "/";
    }
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


    socket.emit("checkStoreSettings", {}, function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            if (responseData[0]) {
                if (responseData[1]) {
                    document.getElementById("listDetailsSwitch").click();
                }
                if (responseData[2]) {
                    document.getElementById("dvpMenu").click();
                }
                document.getElementById("storeSettings").click();
            }
        }
    });

    socket.emit("getApercuInfos", {}, function (err, resp) {
        if (err) {
            alert(JSON.stringify(err));
        } else {
            document.getElementById("infosNbEleves").textContent = resp[0];
            document.getElementById("infosNbClasses").textContent = resp[1];
            document.getElementById("infosNbusers").textContent = resp[2];
        }
    })
}



setInterval(checkStatus, 3000);

function checkStatus() {
    document.getElementById("refreshServerLoad").style.display = "block";
    if (socket.connected) {
        document.getElementById("co-status-on").style.display = "flex";
        document.getElementById("co-status-off").style.display = "none";
    } else {
        document.getElementById("co-status-on").style.display = "none";
        document.getElementById("co-status-off").style.display = "flex";
    }
    setTimeout(() => {
        document.getElementById("refreshServerLoad").style.display = "none";
    }, 100);
}

const menus = document.querySelectorAll(".page-frame");
function hidePages() {
    for (let i = 0; i < menus.length; i++) {
            menus[i].style.display = "none"
    }
}

document.getElementById("title").addEventListener("click", function (){
    hidePages();
    document.getElementById("infos-generales").style.display = "block"; });

document.getElementById("b-inscriptions").addEventListener("click", function (){
    hidePages();
    document.getElementById("inscriptions").style.display = "flex"; });

document.getElementById("b-eleves").addEventListener("click", function (){
    hidePages();
    refreshElist();
    document.getElementById("eleves").style.display = "flex"; });

document.getElementById("b-params").addEventListener("click", function (){
    hidePages();
    document.getElementById("params").style.display = "flex"; });

document.getElementById("b-dvp").addEventListener("click", function (){
    hidePages();
    document.getElementById("dvp").style.display = "flex"; });

document.getElementById("b-users").addEventListener("click", function (){
    hidePages();
    refreshUsersList();
    document.getElementById("users").style.display = "flex"; });

document.getElementById("b-classes").addEventListener("click", function (){
    hidePages();
    refreshClasseList();
    document.getElementById("classes").style.display = "flex"; });


document.getElementById("download").addEventListener("click", function () {
    alert("Téléchargement indisponible");
    /*switch (document.getElementById("exportFormat").value) {
        case "csv":
            socket.emit("downloadfile", "csv", function(err){
                if (err) {
                    alert(err.value);
                } else {
                    downloadFile("/data/eleves.csv", "eleves.csv");
                }
            });
            break;
        case "json":
            downloadFile("/data/eleves.json", "eleves.json");
            break;
        default:
            alert("Merci de choisir un format d'exportation.");
    }*/
});


function downloadFile(url, name) {
    let downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = name;
    downloadLink.target = "_blank";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


document.getElementById("add-eleve").addEventListener("click", function() {addEleve() });

function addEleve() {
    if (document.getElementById("result-msg") != null) {
        document.getElementById("result-msg").remove();
    }
    let prenom = document.getElementById("i-prenom").value;
    let nom = document.getElementById("i-nom").value;
    let age = document.getElementById("i-age").value;
    let classe = document.getElementById("i-classe").value;
    let mail = document.getElementById("i-email").value;
    if (mail.length < 1) {
        mail = null;
    }
    let tel = document.getElementById("i-tel").value;
    if (tel.length < 1) {
        tel = null;
    }
    let div = document.getElementById("div-result-msg");
    let elt = document.createElement("h5");
    if (prenom.length < 1 || nom.length < 1 || age.length < 1 || classe.length < 1) {
        elt.textContent = "Erreur : au moins un champ est manquant.";
        elt.style.color = "red";
    } else {
        socket.emit("new-eleve", [prenom, nom, age, classe, mail, tel], function(err){
            if (err) {
                elt.textContent = `Erreur serveur : ${err}`;
                elt.style.color = "red";
            } else {
                elt.textContent = `${prenom} ${nom} a été ajouté à la liste des élèves.`;
                elt.style.color = "green";
                document.getElementById("i-prenom").value = "";
                document.getElementById("i-nom").value = "";
                document.getElementById("i-age").value = "";
                document.getElementById("i-classe").value = "";
                document.getElementById("i-email").value = "";
                document.getElementById("i-tel").value = "";
            }
        });
    }
    elt.id = "result-msg";
    div.appendChild(elt);
}

document.getElementById("refresh-elist").addEventListener("click", function() {
    document.getElementById("sync-ok").style.display = "none";
    document.getElementById("sync-icon").style.display = "block";
    refreshElist();
});

function refreshElist() {
    let div = document.getElementById("elist");
    div.innerHTML = "";
    socket.emit("refresh-list", {}, function(err, responseData) {
        if (err || socket.connected === false) {
            document.getElementById("aucun-apercu").textContent = err.value;
            document.getElementById("aucun-apercu").style.color = "red";
        } else {
            for (let i = 0; i < responseData[0].length; i++) {
                let elt = document.createElement("h5");
                div.appendChild(elt);
                elt.id = responseData[4][i];
                elt.className = "eleveListElt";
                if (moreListInfos) {
                elt.textContent = responseData[0][i]+" "+responseData[1][i]+" | "+responseData[2][i]+" ans | Classe : "+responseData[3][i];
                } else {
                    elt.textContent = responseData[0][i]+" "+responseData[1][i]
                }
                elt.addEventListener("click", function () {
                    showEleveDetails(i, responseData);
                });
            }

            setTimeout(() => {
                document.getElementById("sync-icon").style.display = "none";
                document.getElementById("sync-ok").style.display = "block";
            }, 100)
        }
    });
}

function showEleveDetails(id, data) {
    document.getElementById("aucun-apercu1").style.display = "none";
    document.getElementById("div-apercu").style.display = "flex";
    let apercus = document.querySelectorAll(".a-text");
    for (let i = 0; i < apercus.length; i++) {
        apercus[i].style.color = "#3c4043";
    }
    document.getElementById("a-prenom").textContent = `Prénom : ${data[0][id]}`;
    document.getElementById("a-nom").textContent = `Nom : ${data[1][id]}`;
    document.getElementById("a-age").textContent = `Âge : ${data[2][id]}`;
    document.getElementById("a-classe").textContent = `Classe : ${data[3][id]}`;
    document.getElementById("a-mail").textContent = `Mail : ${data[5][id]}`;
    document.getElementById("a-tel").textContent = `Téléphone : ${data[6][id]}`;
    document.getElementById("a-id").textContent = `ID : ${data[4][id]}`;
}

document.getElementById("listDetailsSwitch").addEventListener("click", function() {
    moreListInfos = document.getElementById("listDetailsSwitch").checked
});

document.getElementById("dvpMenu").addEventListener("click", function() {
    if (document.getElementById("dvpMenu").checked === true) {
        document.getElementById("b-dvp").style.display = "block";
    } else {
        document.getElementById("b-dvp").style.display = "none";
    }
});

document.getElementById("storeSettings").addEventListener("click", function() {
    socket.emit("storeSettings",
        [document.getElementById("storeSettings").checked,
        document.getElementById("listDetailsSwitch").checked,
        document.getElementById("dvpMenu").checked],
        function (err) {
            if (err) {
                alert(err.value);
            }
    });
});

document.getElementById("checkDir").addEventListener("click", function() {
    socket.emit("checkDir", document.getElementById("fileDir").value,
        function (err) {
            if (err) {
                document.getElementById("fileDir").style.backgroundColor = "rgba(255, 0, 0, 0.2)";
            } else {
                document.getElementById("fileDir").style.backgroundColor = "rgba(0, 255, 0, 0.2)";
            }
    });
});

document.getElementById("insertPath").addEventListener("click", function() {
    document.getElementById("fileDir").value = document.getElementById("pathList").value;
});

document.getElementById("showFile").addEventListener("click", function() {
    socket.emit("readFile", document.getElementById("fileDir").value, function (err, responseData) {
        document.getElementById("dataLines").innerHTML = "";
        if (err) {
            alert(err.value);
        } else {
            for (let i = 0; i < responseData.length; i++) {
                const line = document.createElement("h5");
                line.id = `ligne${i}`;
                line.textContent = `${i.toLocaleString('fr', {minimumIntegerDigits: 3, useGrouping: false})} | ` + `${responseData[i]}`;
                document.getElementById("dataLines").appendChild(line);
            }
        }
    });
});

document.getElementById("editValueButton").addEventListener("click", function () {
    let editValueName = document.getElementById("editValueName").value;
    let editValue = document.getElementById("editValue").value;
    let id = document.getElementById("a-id").textContent.split(" ")[2];
    if (editValueName !== "" && editValue !== "") {
        socket.emit("changeValue", [id, editValueName, editValue], function(err) {
            if (err === null) {
                document.getElementById("a-" + editValueName).style.color = "orange";
            } else {
                alert(JSON.stringify(err));
            }
        });
    }
});

document.getElementById("editUserValueButton").addEventListener("click", function () {
    let editUserValueName = document.getElementById("editUserValueName").value;
    let editUserValue = document.getElementById("editUserValue").value;
    let uname = document.getElementById("infos-uname").textContent;
    if (editUserValueName !== "" && editUserValue !== "") {
        socket.emit("changeUserValue", [uname, editUserValueName, editUserValue], function(err) {
            if (err === null) {
                alert("Informations utilisateur modifiées avec succès.")
            } else {
                alert(JSON.stringify(err));
            }
        });
    }
});


document.getElementById("deleteEleveButton").addEventListener("click", function () {
    let prenom = document.getElementById("a-prenom").textContent.split(" ")[2]
    let nom = document.getElementById("a-nom").textContent.split(" ")[2]
    let id = document.getElementById("a-id").textContent.split(" ")[2]
    if (confirm(`Avertissement : irréversible ! \nSupprimer l'élève ${prenom} ${nom} ?`)) {
        socket.emit("deleteEleve", id, function (err) {
            if (err) {
                alert(err);
            } else {
                alert("Élève supprimé.");
            }
        });
    }
});

document.getElementById("changeClasseButton").addEventListener("click", function () {
    let prenom = document.getElementById("a-prenom").textContent.split(" ")[2];
    let nom = document.getElementById("a-nom").textContent.split(" ")[2];
    let id = document.getElementById("a-id").textContent.split(" ")[2];
    classePopup(prenom, nom, id);
});

function classePopup(prenom, nom, id) {
    document.getElementById('classePopup').style.display = "flex";
    document.getElementById("changeClasseTitre").textContent = `Choisir une nouvelle classe pour ${prenom} ${nom} :`
    socket.emit("getClasseList", {}, function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            let div = document.getElementById("popupList");
            div.innerHTML = "";
            for (let i = 0; i < responseData[0].length; i++) {
                let elt = document.createElement("h5");
                div.appendChild(elt);
                elt.id = `${responseData[0][i]}`;
                elt.className = "classeListElt";
                elt.textContent = responseData[0][i];
                elt.addEventListener('click', function () {
                    socket.emit("changeValue", [id, "classe", elt.id], function(err) {
                        if (err === null) {
                            document.getElementById('classePopup').style.display = "none";
                            alert(`${prenom} ${nom} a été déplacé vers la classe "${responseData[0][i]}."`)
                        } else {
                            alert(JSON.stringify(err));
                        }
                    });
                });
            }
        }
    });
}


document.getElementById("b-logout").addEventListener("click", function () {
        document.location.href = "/";
        localStorage.removeItem("authkey");
});

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

document.getElementById("sendinvite").addEventListener("click", function () {
    let uname = document.getElementById("i-user").value;
    let mail = document.getElementById("i-mail").value;
    let type = document.getElementById("acctype").value;
    let customText = document.getElementById("i-customMail").value;
    socket.emit("sendInvitation", [uname, mail, type, customText], function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            alert(responseData);
        }
    });
});

function refreshUsersList() {
    socket.emit("getUsersList", {}, function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            let div = document.getElementById("ulist");
            div.innerHTML = "";
            for (let i = 0; i < responseData[0].length; i++) {
                let elt = document.createElement("h5");
                div.appendChild(elt);
                elt.id = `${responseData[0][i]}`;
                elt.className = "usersListElt";
                elt.textContent = "Nom d'utilisateur : " + responseData[0][i]+" | Profil : "+responseData[1][i];
            }
            addUsersEvent(responseData);
        }
    });
}

function refreshClasseList() { // l'eltId est le nom de la classe, l'id seul est celui de la db
    socket.emit("getClasseList", {}, function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            let div = document.getElementById("clist");
            div.innerHTML = "";
            for (let i = 0; i < responseData[0].length; i++) {
                let elt = document.createElement("h5");
                div.appendChild(elt);
                elt.id = `${responseData[0][i]}`;
                elt.className = "classeListElt";
                elt.textContent = "Nom de la classe : " + responseData[0][i];
            }
            addClassesEvent();
        }
    });
}

function addClassesEvent() {
    let classesButtons = document.querySelectorAll(".classeListElt")
    for (let i = 0; i < classesButtons.length; i++) {
        classesButtons[i].addEventListener("click", function () {
            showClasseDetails(classesButtons[i].id);
            document.getElementById("aucun-apercu3").style.display = "none";
            document.getElementById("apercu-classe").style.display = "none";
            document.getElementById("classeChargement").style.display = "flex";
        });
    }
}

function showClasseDetails(id) {
    socket.emit("getClasseDetails", id, function (err, res) {
        if (err) {
            alert(err);
        } else {
            document.getElementById("classe-id").textContent = res[0];
            document.getElementById("classe-nom").textContent = id;
            document.getElementById("classe-prof").textContent = res[1];
            document.getElementById("classe-nbeleves").textContent = res[2];
        }
    });
    classeElevesList(id);
}


function classeElevesList(id) {
    socket.emit("getClasseElevesList", id, function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            let div = document.getElementById("celist");
            div.innerHTML = "";
            for (let i = 0; i < responseData[0].length; i++) {
                let elt = document.createElement("h5");
                div.appendChild(elt);
                elt.id = `ce-${responseData[2][i]}`;
                elt.className = "h5 celistElt";
                elt.textContent = i+1 + ". " + responseData[0][i] + " " + responseData[1][i];
                elt.addEventListener('click', function () {
                    document.getElementById('elevePopup').style.display = "flex";
                    document.getElementById('popupName').textContent = responseData[0][i] + " " + responseData[1][i] + " (" + responseData[2][i] + ")";
                    hidePopupFcts();
                    document.getElementById("popupButtons").style.display = "flex";
                });
            }
            document.getElementById("classeChargement").style.display = "none";
            document.getElementById("apercu-classe").style.display = "flex";
        }
    });
}

function addUsersEvent() {
    let usersButtons = document.querySelectorAll(".usersListElt")
    for (let i = 0; i < usersButtons.length; i++) {
        usersButtons[i].addEventListener("click", function () {
            showUserDetails(usersButtons[i].id);
        });
    }
}

function showUserDetails(id) {
    document.getElementById("aucun-apercu2").style.display = "none";
    document.getElementById("userinfosBlock").style.display = "block";
    socket.emit("getUserDetails", id, function (err, res) {
        if (err) {
            alert(err);
        } else {
            document.getElementById("infos-uname").textContent = id;
            document.getElementById("infos-type").textContent = res[0];
            document.getElementById("infos-statut").textContent = res[1];
            document.getElementById("infos-idinvite").textContent = res[2];
            document.getElementById("infos-permissionLevel").textContent = res[3];
            document.getElementById("infos-id").textContent = res[4];
        }
    });
}

document.getElementById("editProfName").addEventListener("click", function () {
    let profName = document.getElementById("profName").value;
    let id = document.getElementById("classe-nom").textContent;
    if (id.length < 1) {
        alert("Veuillez sélectionner une classe.");
    } else {
        if (profName.length > 2) {
            socket.emit("editProfName", [profName, id], function (err) {
                if (err) {
                    alert(err);
                } else {
                    alert("Nom du professeur actualisé.");
                }
            });
        } else {
            alert("Le nom du professeur est trop court.");
        }
    }
});

document.getElementById("createClasse").addEventListener("click", function () {
    let classeName = document.getElementById("classeName").value;
    if (classeName.length < 1) {
        alert("Le nom de la classe est trop court.");
    } else {
        socket.emit("createClasse", classeName, function (err) {
            if (err) {
                alert(err);
            } else {
                alert(`La classe "${classeName}" a été créée.`);
                refreshClasseList();
            }
        });
    }
});

document.getElementById("moveEleve").addEventListener("click", function () {
    let prenomNom = document.getElementById("popupName").textContent.split(/[ ()]+/);
    let prenom = prenomNom[0];
    let nom = prenomNom[1];
    let id = prenomNom[2];
    document.getElementById("elevePopup").style.display = "none";
    classePopup(prenom, nom, id);
});
/*
document.getElementById("moveEleveConfirm").addEventListener("click", function () {
    let classe = document.getElementById("popupClasseName").value;
    if (classe.length > 0) {
        socket.emit("getClasseDetails", name, function (err, res) {
            if (err) {
                alert(err);
            } else if (res[0].length > 0) {

            } else {
                if (confirm(`La classe "${classe} n'existe pas. Voulez-vous la créer et y ajouter l'élève ?"`)) {
                    socket.emit("createClasse", classe, function (err) {
                        if (err) {
                            alert(err);
                        } else {
                            alert(`La classe "${classe}" a été créée.`);
                        }
                    });
                    //socket.emit("changeEleveClasse", [e])
                }
            }
        });
    } else {
        alert("Merci d'entrer un nom de classe valide.");
    }
}); */

function hidePopupFcts() {
    let popupFct = document.querySelectorAll(".popupFct");
    for (let i = 0; i < popupFct.length; i++) {
        popupFct[i].style.display = "none";
    }
}

document.getElementById("deleteClasse").addEventListener("click", function () {
    let classeName = document.getElementById("classe-nom").textContent;
    if (confirm("La classe sera effacée de la liste des classes. Les élèves ne seront pas effacés et conserveront ce nom de classe. Voulez-vous supprimer la classe ?")) {
        socket.emit("deleteClasse", ["classeOnly", classeName], function (err) {
            if (err) {
                alert(JSON.stringify(err))
            } else {
                alert("Suppression terminée.");
            }
        });
    }
});

document.getElementById("deleteClasseNom").addEventListener("click", function () {
    let classeName = document.getElementById("classe-nom").textContent;
    if (confirm("La classe sera effacée de la liste des classes. Le nom de classe des élèves sera réinitialisé mais les élèves ne seront pas supprimés. Voulez-vous supprimer la classe ?")) {
        socket.emit("deleteClasse", ["classeNom", classeName], function (err) {
            if (err) {
                alert(JSON.stringify(err));
            } else {
                alert("Suppression terminée.");
            }
        });
    }
});

document.getElementById("deleteClasseEleves").addEventListener("click", function () {
    let classeName = document.getElementById("classe-nom").textContent;
    if (confirm("La classe sera effacée de la liste des classes. Attention : les élèves contenus dans la classe seront complètement effacés. Voulez-vous supprimer la classe ?")) {
        socket.emit("deleteClasse", ["classeEleves", classeName], function (err) {
            if (err) {
                alert(JSON.stringify(err));
            } else {
                alert("Suppression terminée.");
            }
        });
    }
});

document.getElementById("transferClasseButton").addEventListener("click", function () {
    let classeName = document.getElementById("classe-nom").textContent;
    let classeDest = document.getElementById("transferClasseName").value;
    if (classeDest.length > 0 && classeName.length > 0 && confirm(`Tous les élèves de la classe "${classeName}" seront placés dans la classe "${classeDest}". Confirmer ?`)) {
        socket.emit("transferClasse", [classeName, classeDest], function (err) {
            if (err) {
                alert(JSON.stringify(err));
            } else {
                alert(`Élèves transférés de la classe "${classeName}" vers la classe "${classeDest}".`);
            }
        });
    }
});

document.getElementById("updatePassword").addEventListener("click", function () {
    let uname = document.getElementById("infos-uname").textContent;
    socket.emit('updatePassword', uname, function (err) {
       if (err) {
           alert(err);
       }
    });
});
document.getElementById("searchButton").addEventListener("click", function () {
    let recherche = document.getElementById("searchBar").value ;
    if (recherche.length > 0) {
        socket.emit("searchEleve", recherche, function (err, responseData) {
            if (err) {
                alert(err);
            } else {
                let div = document.getElementById("elist");
                div.innerHTML = "";
                if (err || socket.connected === false) {
                    document.getElementById("aucun-apercu").textContent = err.value;
                    document.getElementById("aucun-apercu").style.color = "red";
                } else {
                    for (let i = 0; i < responseData[0].length; i++) {
                        let elt = document.createElement("h5");
                        div.appendChild(elt);
                        elt.id = responseData[4][i];
                        elt.className = "eleveListElt";
                        if (moreListInfos) {
                            elt.textContent = responseData[0][i]+" "+responseData[1][i]+" | "+responseData[2][i]+" ans | Classe : "+responseData[3][i];
                        } else {
                            elt.textContent = responseData[0][i]+" "+responseData[1][i]
                        }
                        elt.addEventListener("click", function () {
                            showEleveDetails(i, responseData);
                        });
                    }

                    setTimeout(() => {
                        document.getElementById("sync-icon").style.display = "none";
                        document.getElementById("sync-ok").style.display = "block";
                    }, 100)
                }
            }
        });
    }
});

document.getElementById("paramsInfos").addEventListener('click', function () {
    document.getElementById("paramsInfosPopup").style.display = 'flex';
    document.getElementById("appVersion").textContent = appVersion;
    document.getElementById("dateLastUpdate").textContent = dateLastUpdate;
    socket.emit("getDbVersion", {}, function (err, responseData) {
        if (err) {
            alert(JSON.stringify(err));
        } else {
            document.getElementById("dbVersion").textContent = responseData[0];
            document.getElementById("sessionIp").textContent = responseData[1];
        }
    })
    document.getElementById("sessionOpenTime").textContent = openingTime.toTimeString().split(' ')[0];
});