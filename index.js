const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');
const PORT = process.env.PORT || 3000;

const bcrypt = require ('bcrypt');
const saltRounds = 10;

/*const mysql = require('mysql');
const con = mysql.createConnection({
    host: "localhost",
    user: "nourvsp1_index",
    password: "nourAssoMail",
    database: "nourvsp1_nourvsp",
    multipleStatements: true
});*/

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'nourvsp.online',
    port: 465,
    secure: true,
    auth: {
        user: 'invitation@nourvsp.online',
        pass: 'nourAssoMail'
    }
});

/*con.connect(function(err) {
    if (err) throw err;
    console.log("Webmds database connected.");
});*/

app.use(express.static(__dirname + '/public'));

app.get('/adminmenu', (req, res) => {
    let authkey = req.query.authkey;
    if (authkey) {
        con.query("SELECT EXISTS (SELECT * FROM adminauth WHERE id = ?)", authkey, function (err, result) {
            let newData = getQueryResult(result);
            if (err) {
                res(err);
            } else if (newData === "1") {
                res.sendFile(__dirname + '/admin.html');
            } else {
                res.sendFile(__dirname + '/refused.html');
            }
        });
    } else {
        res.sendFile(__dirname + '/refused.html');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/loginpage', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/invitation', (req, res) => {
    res.sendFile(__dirname + '/invitation.html');
});

server.listen(PORT, () => {
    console.log(`Server started | listening on ${PORT}`);
});
io.on('connection', (socket) => {
    console.log("[CONNECTION] New user connected");

    socket.on("disconnect", () => {
        console.log("[CONNECTION] User disconnected");
    });

    socket.on("new-eleve", function (data, res) {
        let sql = "INSERT INTO eleves (prenom, nom, age, classe, mail, tel) VALUES (?, ?, ?, ?, ?, ?)";
        con.query(sql, [data[0], data[1], data[2], data[3], data[4], data[5]], function (err) {
            if (err) {
                console.log(JSON.stringify(err));
                switch (err["code"]) {
                    case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
                        res("Valeur inattendue pour un champ")
                        break;
                    default:
                        res(err["code"]);
                }
            } else {
                res(null);
            }
        });
    });

    socket.on("refresh-list", function (data, res) {
        let sql = "SELECT * FROM eleves";
        con.query(sql, function (err, result) {
            if (err) {
                res(err);
            } else {
                res(null, getElevesList(result));
            }
        });
    });

    socket.on("getEleveDetails", function (data, res) {
        let sql = "SELECT * FROM eleves WHERE id = ?";
        con.query(sql, data, function (err, result) {
            console.log(JSON.stringify(result))
            if (err) {
                res(err);
            } else {
                res(null, getElevesList(result));
            }
        });
    });
    /*
    socket.on("downloadfile", async function (data, res) {
        if (data === "csv") {
            console.log("[REQUEST] [#3] [1/3] Received request for CSV download. Starting conversion...");
            let csv = convertToCSV(await getListElt("dl"));
            console.log("[REQUEST] [#3] [2/3] File converted in CSV. Saving result...");
            fs.writeFile("public/data/eleves.csv", csv, (err) => {
                if (err) {
                    res(err);
                } else {
                    console.log("[REQUEST] [#3] [2/3] File saved and transmitted successfully.");
                    res(null);
                }
            });
        } else {
            res("erreur assignement");
        }
    });

    socket.on("storeSettings", async function (data, res) {
        await dbS.push("/storeSettingsTrue", data);
        res(null);
    });

    socket.on("checkStoreSettings", async function (data, res) {
        let sett = await dbS.getData("/storeSettingsTrue");
        res(null, sett);
    });*/

    socket.on("checkDir", async function (data, res) {
        if (fs.existsSync(data)) {
            res(null);
        } else {
            let err = new Error("Erreur de fichier");
            err.name = "findFileError";
            err.value = "Le fichier n'existe pas.";
            res(err);
        }
    });

    socket.on("readFile", function (data, res) {
        fs.readFile(data, (err, fileData) => {
            if (err) {
                err.value = "Fichier non trouvé.";
                res(err);
            } else {
                const lignes = fileData.toString().split("\n");
                res(null, lignes);
            }
        });
    });

    socket.on("changeValue", function (data, res) {
        let sql = "UPDATE eleves SET ?? = ? WHERE id = ?";
        con.query(sql, [data[1], data[2], data[0]], function (err) {
            if (err) {
                res(err);
            } else {
                res(null);
            }
        });
    });

    socket.on("deleteEleve", function (data, res) {
        let sql = "DELETE FROM eleves WHERE id = ?";
        con.query(sql, data, function (err) {
            if (err) {
                res(err);
            } else {
                res(null);
            }
        });
    });

    socket.on("checkCredentials", function (data, res) {
        console.log("[AUTH] Checking credentials")
        let sql = "SELECT pwd FROM users WHERE uname = ?";
        con.query(sql, data[0], async function (err, queryRes) {
            if (err || queryRes.length < 1) {
                res("Identifiants invalides.");
            } else {
                let hash = queryRes[0]["pwd"];
                let match = await bcrypt.compare(data[1], hash);
                    if (match) {
                        console.log("It matches!");
                        con.query("SELECT type, permissionLevel FROM users WHERE uname = ? AND statut = 'confirme'", data[0], function (err, result) {
                            if (err) {
                                res(err);
                            } else {
                                let re = result[0]["type"];
                                let permlvl = result[0]["permissionLevel"];
                                let id = randId();
                                switch (re) {
                                    case "admin":
                                        con.query("INSERT INTO adminauth (id, permissionLevel, date) VALUES (?, ?, NOW())", [id, permlvl], function (err) {
                                            if (err) {
                                                res(err);
                                            } else {
                                                res(null, ["adminmenu", id]);
                                            }
                                        });
                                        break;

                                    case "parent":
                                        err = "Les comptes parents ne sont pas accessibles pour le moment";
                                        res(err);
                                        break;

                                    case "eleve":
                                        err = "Les comptes élèves ne sont pas accessibles pour le moment";
                                        res(err);
                                        break;

                                    case "professeur":
                                        err = "Les comptes professeurs ne sont pas accessibles pour le moment";
                                        res(err);
                                        break;

                                    default:
                                        err = "Compte non confirmé";
                                        res(err);
                                }
                            }
                        });
                    } else {
                        console.log("Invalid password!");
                        res("Identifiants invalides.");
                    }
            }
        });
    });

    socket.on("queryAuth", function (data, res) {
        console.log("[AUTH] Checking authorization");
        con.query("SELECT EXISTS (SELECT * FROM adminauth WHERE id = ?)", data, function (err, result) {
            let newData = getQueryResult(result);
            if (err) {
                res(err);
            }
                res(null, newData);
        });
    });

    socket.on("sendInvitation", function (data, res) { //data : 0 = uname, 1 = destinataire, 2 = type (parent..), 3 = custom text
        console.log("[AUTH] Sending account creation mail");
        let creationId = randId();

        con.query("SELECT uname FROM users WHERE uname = ?", data[0], function (err, resp) {
            if (err) {
                res(err);
            } else if (resp.length > 0) {
                res("Nom d'utilisateur déjà utilisé.");
            } else {
                con.query("INSERT INTO users (uname, pwd, type, inviteid, statut) VALUES (?, ?, ?, ?, ?)", [data[0], "default", data[2], creationId, "attente"], function (err) {
                    if (err) {
                        res(err);
                    } else {
                        let link = "http://localhost:3000/invitation?id=" + creationId;
                        sendMail(data[1], data[2], link, data[3]);
                        res(null, "Mail envoyé, utilisateur ajouté dans la liste d'attente.");
                    }
                });
            }
        });
    });

    socket.on("createAccount", function (data, res) {
        bcrypt.hash(data[0], saltRounds, function(err, hash) {
            if (err) {
                res(err);
            } else {
                console.log("hash : " + hash);
                con.query("UPDATE users SET pwd = ?, inviteid = '', statut = 'confirme' WHERE inviteid = ?", [hash, data[1]], function (err) {
                    if (err) {
                        res("Échec lors de la création du compte. Veuillez contacter la madrassa.");
                    } else {
                        res(null);
                    }
                });
            }
        });
    });

    socket.on("checkCreationId", function (data, res) {
        con.query("SELECT uname FROM users WHERE inviteid = ?", data, function (err, result) {
            let resp = getQueryResult(result);
            if (resp) {
                res(null, resp);
            } else {
                res("undefined");
            }
        });
    });

    socket.on("getUsersList", function (data, res) {
        con.query("SELECT uname, type FROM users", data, function (err, result) {
            if (err) {
                res(err);
            } else {
                res(null, transformUsersList(result));
            }
        });
    });

    socket.on("getUserDetails", function (data, res) {
        con.query("SELECT type, statut, inviteid, permissionLevel, id FROM users WHERE uname = ?", data, function (err, result) {
            if (err) {
                res(err);
            } else {
                res(null, transformUserInfos(result));
            }
        });
    });

    socket.on("getClasseList", function (data, res) {
        con.query("SELECT * FROM classes", data, function (err, result) {
            if (err) {
                res(err);
            } else {
                res(null, transformClasseList(result));
            }
        });
    });

    socket.on("getClasseDetails", function (data, res) {
        con.query("SELECT * FROM classes WHERE nom = ?", data, function (err, result) {
            if (err) {
                res(err);
            } else {
                res(null, transformClasseList(result));
            }
        });
    });

    socket.on("getClasseElevesList", function (data, res) {
        con.query("SELECT prenom, nom, id FROM eleves WHERE classe = ?", data, function (err, result) {
            if (err) {
                res(err);
            } else {
                con.query("UPDATE classes SET nbeleves = ? WHERE nom = ?", [result.length, data], function (err) {
                    if (err) {
                        console.log("Unable to update nbeleves");
                    }
                });
                res(null, transformClasseElevesList(result));
            }
        });
    });

    socket.on("editProfName", function (data, res) {
        con.query("UPDATE classes SET prof = ? WHERE nom = ?", [data[0], data[1]], function (err, result) {
            if (result) {
                res(null, getQueryResult(result))
            } else {
                res("Échec lors de la création du compte. Veuillez contacter la madrassa.");
            }
        });
    });

    socket.on("createClasse", function (data, res) {
        con.query("INSERT INTO classes (nom, prof, nbeleves) VALUES (?, ?, ?)", [data, null, 0], function (err) {
            if (err) {
                res(JSON.stringify(err));
            } else {
                res(null);
            }
        });
    });

    socket.on("getPermissionLevel", function (data, res) {
        con.query("SELECT permissionLevel FROM adminauth WHERE id = ?", data, function (err, resp) {
            if (err) {
                res(JSON.stringify(err));
            } else {
                res(null, resp[0]["permissionLevel"]);
            }
        });
    });

    socket.on("deleteClasse", function (data, res) { // 0 : type de suppression, 1 : nom classe
        let sql;
        switch (data[0]) {
            case "classeOnly":
                sql = "DELETE FROM classes WHERE nom = ?";
                con.query(sql, data[1], function (err) {
                    if (err) {
                        res(err);
                    } else {
                        res(null);
                    }
                });
                break;
            case "classeNom":
                sql = "DELETE FROM classes WHERE nom = ?; UPDATE eleves SET classe = '' WHERE classe = ?";
                con.query(sql, [data[1], data[1]], function (err) {
                    if (err){
                        res(err);
                    } else {
                        res(null);
                    }
                });
                break;
            case "classeEleves":
                sql = "DELETE FROM classes WHERE nom = ?; DELETE FROM eleves WHERE classe = ?";
                con.query(sql, [data[1], data[1]], function (err) {
                    if (err){
                        res(err);
                    } else {
                        res(null);
                    }
                });
                break;
            default:
                res("Erreur lors de la suppression");

        }
    });

    socket.on("changeUserValue", function (data, res) {
        let sql = "UPDATE users SET ?? = ? WHERE uname = ?";
        con.query(sql, [data[1], data[2], data[0]], function (err) {
            if (err) {
                res(err);
            } else {
                res(null);
            }
        });
    });

    socket.on("searchEleve", function (data, res) {
        let sql = "SELECT * FROM eleves WHERE prenom SOUNDS LIKE ? OR nom SOUNDS LIKE ?";
        con.query(sql, [data, data], function (err, resp) {
            if (err) {
                res(err);
            } else {
                res(null, getElevesList(resp));
            }
        });
    });

    socket.on("transferClasse", function (data, res) {
        let sql = "UPDATE eleves SET classe = ? WHERE classe = ?";
        con.query(sql, [data[1], data[0]], function (err) {
            if (err) {
                res(err);
            } else {
                res(null);
            }
        });
    });
});


function transformClasseList(data) {
    let noms = [];
    let profs = [];
    let nbeleves = [];
    let ids = [];
    for (let i = 0; i < data.length; i++) {
        noms.push(data[i]["nom"]);
        profs.push(data[i]["prof"]);
        nbeleves.push(data[i]["nbeleves"]);
        ids.push(data[i]["id"]);
    }
    return [noms, profs, nbeleves, ids];
}

function transformClasseElevesList(data) {
    let prenoms = [];
    let noms = [];
    for (let i = 0; i < data.length; i++) {
        prenoms.push(data[i]["prenom"]);
        noms.push(data[i]["nom"]);
    }
    return [prenoms, noms];
}
function transformUserInfos(data) {
    let type = data[0]["type"];
    let statut = data[0]["statut"];
    let inviteid = data[0]["inviteid"];
    let id = data[0]["id"];
    return [type, statut, inviteid, id];
}


function transformUsersList(data) {
    let unames = [];
    let types = [];
    for (let i = 0; i < data.length; i++) {
        unames.push(data[i]["uname"]);
        types.push(data[i]["type"]);
    }
    return [unames, types];
}

function getQueryResult(rawData) {
    if (rawData) {
        let finalData = JSON.stringify(rawData).split(":");
        return (finalData[finalData.length - 1].split("}")[0].replaceAll("\"", "").replaceAll("[]", ""));
    }
}

function getElevesList(data) {
    let prenoms = [];
    let noms = [];
    let ages = [];
    let classes = [];
    let mails = [];
    let tels = [];
    let ids = [];
    for (let i = 0; i < data.length; i++) {
        prenoms.push(data[i]["prenom"]);
        noms.push(data[i]["nom"]);
        ages.push(data[i]["age"]);
        classes.push(data[i]["classe"]);
        if (!data[i]["mail"]) {
            mails.push("Aucun");
        } else {
            mails.push(data[i]["mail"]);
        }
        if (!data[i]["tel"]) {
            tels.push("Aucun");
        } else {
            tels.push(data[i]["tel"]);
        }
        ids.push(data[i]["id"]);
    }
    return [prenoms, noms, ages, classes, ids, mails, tels];
}

/*function convertToCSV(arr) {
    const array = [Object.keys(arr[0])].concat(arr)

    return array.map(it => {
        return Object.values(it).toString()
    }).join('\n')
}*/

function clearAuth() {
    let sql = "DELETE FROM adminauth WHERE date < DATE_SUB(NOW(), INTERVAL '30' MINUTE)";
    con.query(sql, function (err) {
        if (err){
            throw err;
        } else {
            console.log("[AUTH] Clearing expired auth keys");
        }
    });
}

setInterval(clearAuth, 60000);

function sendMail(dest, type, lien, customText) {
    let mailOptions = {
        from: 'Association Nour <invitation@nourvsp.online>',
        to: dest,
        subject: "Création de votre compte pour l'Association Nour",
        text:
            `Ceci est un message automatique, merci de ne pas y répondre.

Vous avez été invité à créer un compte sur la plateforme web de l'Association Nour de Villers-Saint-Paul.

Cette plateforme est une application web facilitant la gestion de l'école et la transmission d'informations entre les parents et les éducateurs. Afin de créer votre compte, cliquez sur le lien ci-dessous et suivez les instructions :

>> ${lien} <<

Attention : ce lien est personnel, ne le communiquez pas. Le lien n'expire pas. Si vous rencontrez un problème, contactez l'association.`

    };

    if (customText) {
        mailOptions.text = customText.replaceAll("[lien]", lien);
    }


    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${dest}. Infos : ` + info.response);
        }
    });
}

function randId() {
    let characters = "0123456789abcdef";
    let str = "";
    for(let i = 0; i < 64; i++){
        str += characters[Math.floor(Math.random() * 16)]
    }
    return str;
}
