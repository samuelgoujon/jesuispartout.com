# jesuispartout.com

Données

Les données sont enregistrées dans deux fichiers CSV :
- fichier « nodes » : liste des personnalités et des organisations ;
- fichier « connections » : liste les connexions entre les personnalités et les organisations ;
- colonne « wikipedia » (contenu dans le fichier « nodes ») : les lien vers le fichier JSON de l’article Wikipédia associé.

Nouvelle fonctionnalité à rajouter : 

Faire une fonction qui récupère et affiche dans la barre latérale droite l’extrait ("prop=extracts" du lien JSON) de l’article Wikipédia contenu dans le lien JSON de l’article :

Par exemple, pour « Alain Finkielkraut », lien JSON est : https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Alain%20Finkielkraut


 Problème rencontré ==> « cors issues » avec l’API de Wikipédia