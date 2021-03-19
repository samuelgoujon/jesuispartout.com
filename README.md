# jesuispartout.com

Les données sont enregistrées dans deux fichiers CSV :
- fichier « nodes » : liste des personnalités et des organisations ;
- fichier « connections » : liste les connexions entre les personnalités et les organisations ;

La colonne « wikipedia » (contenu dans le fichier « nodes ») contient les liens vers le fichier JSON de l’article Wikipédia associé.

Nouvelle fonctionnalité à rajouter : 

Faire une fonction qui récupère et affiche dans la barre latérale droite l’extrait ("prop=extracts" du lien JSON) de l’article Wikipédia contenu dans le lien JSON :

Par exemple, pour « Alain Finkielkraut », lien JSON est : https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Alain%20Finkielkraut


#### Fonction : cartographie/scripts/main.js ####

function loadWiki(wikipedia, callback, reject) {
    var http = new XMLHttpRequest();

    http.onreadystatechange = function () {
    if (this.readyState == 4) {
        if (this.status == 200) {
            console.log(this);
            callback();
        } else if (reject) {
            reject();
        }
    }
    };

    http.open("HEAD", wikipedia, true);
    http.setRequestHeader("Origin", "*");
    http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    http.send();
}


 Problème rencontré ==> « cors issues » avec l’API de Wikipédia