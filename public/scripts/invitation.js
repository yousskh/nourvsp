const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const id = urlParams.get('id')


socket = io();

socket.emit("checkCreationId", id, function (err, responseData) {
    if (err) {
        window.location.href = "/";
    } else {
        document.getElementById("greet-name").textContent = `Vous avez été invité à créer un compte . Choisissez un mot de passe pour créer votre compte. Votre nom d'utilisateur est : ${responseData}`;
    }
});



document.getElementById("createAccount").addEventListener("click", function() {
    let pass1 = document.getElementById("password-creation").value;
    let pass2 = document.getElementById("password-confirm").value;
    if (pass1.length > 8) {
        if (pass1 === pass2) {
            socket.emit("createAccount", [pass1, id], function (err) {
                if (err) {
                    alert(err);
                } else {
                    alert("Votre compte a été créé avec succès.");
                    window.location.href = "/";
                }
            });
        } else {
            alert("Les mots de passe ne correspondent pas.");
        }
    } else {
        alert("Mot de passe trop court.");
    }
});