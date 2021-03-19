# jesuispartout.com

## Données

Les données sont enregistrées dans deux fichiers CSV cartographie/data :
+ Le fichier « nodes » : liste des personnalités et organisations ;
- La colonne « wikipedia » (contenu dans le fichier « nodes ») contient les liens vers le fichier JSON associé à l’article Wikipédia de la personnalité ou de l’organisation.
+ Le fichier « connections » : liste les connexions entre personnalités et organisations ;


## Nouvelle fonctionnalité à rajouter

Rajouter une fonction qui récupère et affiche dans la barre latérale droite l’extrait ("prop=extracts" du fichier JSON) de l’article Wikipédia contenu dans le lien API (les liens sont contenus dans la colonne « wikipedia » du fichier CSV « nodes ») :

Par exemple, pour « Alain Finkielkraut », lien JSON est : https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Alain%20Finkielkraut


__Fichier : cartographie/scripts/main.js__

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
```
Problème rencontré avec l’API de Wikipédia ==> __« cors issues »__
```