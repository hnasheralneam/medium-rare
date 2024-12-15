let alertContainer = document.querySelector(".alert-outer");
let alertsParent = document.querySelector(".alert-parent")
let holding = false;

export function showAlerts() {
    alertContainer.style.visibility = "visible";
}

export function hideAlerts(callback) {
    if (holding) {
        let unhold = setInterval(() => {
            if (!holding) {
                hideAlerts(callback);
                clearInterval(unhold);
                if (callback) callback();
            }
        }, 200);
    }
    else {
        alertContainer.style.visibility = "hidden";
        alertsParent.innerHTML = "";
    }
}

export function createAlert(text, standalone, shaky) {
    if (holding && standalone === undefined) {
        let unhold = setInterval(() => {
            if (!holding) {
                createAlert(text, undefined, shaky);
                clearInterval(unhold);
            }
        }, 200);
    }
    else {
        if (standalone) showAlerts();
        let newAlert = document.createElement("div");
        let alertText = document.createElement("p");
        let alertButton = document.createElement("button");

        if (shaky) {
            newAlert.classList.add("shaky");
        }

        newAlert.classList.add("alert");
        alertText.textContent = text;
        alertButton.textContent = "Okay";

        alertButton.focus();
        alertButton.addEventListener("click", () => {
            closeAlert();
        });
        
        document.addEventListener("keypress", (e) => {
            if (e.key == "Enter") {
                closeAlert();
            }
        });

        function closeAlert() {
            holding = false;
            newAlert.remove();
            if (standalone) hideAlerts();
        }

        newAlert.append(alertText);
        newAlert.append(alertButton);

        alertsParent.append(newAlert);

        holding = true;
    }
}