<?php

session_start();

$utext = $_REQUEST["user"];
$ptext = $_REQUEST["pass"];
$_SESSION["flag"] = false;

$hostname = "localhost:3306";
$username = "root";
$password = "";

$con = mysqli_connect($hostname, $username, $password);
mysqli_select_db($con, "webmds");
$result = mysqli_query($con, "select * from users");

while($x = mysqli_fetch_array($result))
{
    if($utext == $x["uname"] && $ptext == $x["pwd"])
        $_SESSION["flag"] = true;
}

if($_SESSION["flag"]) {
    header('Location: /adminmenu');
    exit;
}
else
    echo "Invalid username or password!";