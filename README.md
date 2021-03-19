# jesuispartout.com

Les données sont enregistrées dans deux fichiers CSV :
+ Le fichier « nodes » : liste des personnalités et des organisations ;
- La colonne « wikipedia » (contenu dans le fichier « nodes ») contient les liens vers le fichier JSON de l’article Wikipédia associé.
+ Le fichier « connections » : liste les connexions entre les personnalités et les organisations ;


__Nouvelle fonctionnalité à rajouter__

Faire une fonction qui récupère et affiche dans la barre latérale droite l’extrait ("prop=extracts" du lien JSON) de l’article Wikipédia contenu dans le lien JSON (colonne « wikipedia » dans le fichier CSV « nodes ») :

Par exemple, pour « Alain Finkielkraut », lien JSON est : https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Alain%20Finkielkraut


__Fonction : cartographie/scripts/main.js__

``` js
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
```
::: warning
Problème rencontré avec l’API de Wikipédia ==> « cors issues »
:::