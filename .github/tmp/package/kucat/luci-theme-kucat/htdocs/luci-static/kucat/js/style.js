function pdopenbar() {
    document.getElementById("header-bar-left").style.width = "300px";
    document.getElementById("header-bar-left").style.display = "block";
    document.getElementById("header-bar-right").style.width = "0";
    document.getElementById("header-bar-right").style.display = "none"
}

function pdclosebar() {
    document.getElementById("header-bar-left").style.display = "none";
    document.getElementById("header-bar-left").style.width = "0";
    document.getElementById("header-bar-right").style.display = "block";
    document.getElementById("header-bar-right").style.width = "50px"
}
