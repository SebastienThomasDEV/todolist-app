class Coopernet {
    //region VARIABLES

    static url = "https://coopernet.fr";

    static username = "";
    static password = "";

    // contient toutes les infos pour la connexions access_token, refresh_token, expires_in, token_type
    static oauth = {};

    // La charge de données nécessaire pour pouvoir se connecter
    static payload;

    //endregion

    /**
     * Set le nom d'utilisateur de la classe coopernet
     * @param {string} username
     */
    static setUsername = (username) => {
        this.username = username;
    };

    /**
     * Set le mot de passe de la classe coopernet
     * @param {string} password
     */
    static setPassword = (password) => {
        this.password = password;
    };

    /**
     * Prépare le payload pour la demande d'authentification
     * @param {boolean} refresh
     * True: Prépare pour une demande avec le token de rafraîchissement // connection persistente
     * False: Prépare pour une demande avec username et password // à utiliser la première fois
     */
    static setPayload = async (refresh) => {
        const payload = new FormData();

        payload.append("client_id", await Coopernet.getClientID());
        payload.append("client_secret", "pkyuRTHr8hy:;O6tTo");

        if (refresh) {
            payload.append("grant_type", "refresh_token");
            payload.append("refresh_token", this.oauth.refresh_token);
        } else {
            payload.append("grant_type", "password");
            payload.append("username", this.username);
            payload.append("password", this.password);
        }
        this.payload = payload;
    };

    static getClientID = async () => {
        console.log("getClientID");
        const response = await fetch(this.url + "/oauth/memo/clientId");
        if (response.ok) {
            return await response.json();
        }
    };

    /**
     * Set le token Oauth
     * Première méthode à appeler au moment du login
     * Vérifie si le access_token et si il est expiré (tous les 600 secondes environ)
     * Cette fonction stock le refresh_token dans le localStorage.
     * @return {Promise<boolean>} - return false si le status est pas ok SINON return true
     */
    static setOAuthToken = async () => {
        if (this.oauth.hasOwnProperty("access_token")) {
            if (this.isExpiredOauth()) {
                console.log("Demande avec refresh_token");
                return this.setRefreshToken();
            } else {
                console.log("Pas de demande");
                return true;
            }
        } else {
            console.log("Demande avec ID et Password");
            return this.fetchOauth(false);
        }
    };

    /**
     * check si le token a expiré
     * @return {boolean}
     */
    static isExpiredOauth = () => this.oauth.expireAt - Date.now() < 0;

    /**
     * fetch post pour avoir le Oauth token
     * @return {Promise<boolean>}
     * @param {boolean} has_access_token - acces token non expiré
     */
    static fetchOauth = async (has_access_token) => {
        try {
            await Coopernet.setPayload(has_access_token);
            const response = await fetch(this.url + "/oauth/token", {
                method: "POST", body: this.payload,
            });

            if (response.ok) {
                const token = await response.json();
                this.oauth = token;
                this.oauth.expireAt = Date.now() + token.expires_in * 1000;
                localStorage.setItem("token", JSON.stringify(Coopernet.oauth.refresh_token));
                return true;
            }
            throw new Error(`This is an HTTP error: The status is ${response.status}`);
        } catch (err) {
            console.error("fetchOauth:\n", err.message);
            return false;
        }
    };

    /**
     * Set le Oauth token avec le refresh_token
     * @return {Promise<boolean|undefined>}
     */
    static setRefreshToken = async () => this.fetchOauth(true);

    /**
     * Fetch pour avoir toutes les tâches
     * @return {Promise<boolean|any>} - Return false if status not ok else return tasks
     */
    static getTasks = async () => {
        try {
            const response = await fetch(this.url + "/api/tasks", {
                method: "GET", headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    Authorization: this.oauth.token_type + " " + this.oauth.access_token,
                },
            });
            if (response.ok) {
                return await response.json();
            }

            throw new Error(`This is an HTTP error: The status is ${response.status}`);
        } catch (err) {
            console.error("getTasks:\n", err.message);
            return false;
        }
    };

    /**
     * Fetch pour créer une nouvelle tâche
     * @return {Promise<void>}
     */
    static addTask = async (task, order) => {
        const response = await fetch(this.url + "/api/add/task", {
            method: "POST", body: JSON.stringify({
                label: task.label, description: task.description, ended: task.ended, order: order,
            }), headers: {
                Accept: "application/json; charset=UTF-8",
                "Content-type": "application/json; charset=UTF-8",
                Authorization: this.oauth.token_type + " " + this.oauth.access_token,
            },
        });
        return response.json();
    };

    /**
     * Fetch pour mettre à jour une tâche
     * Attention, on est obligé de mettre à jour tous les champs de la tâche
     * @param task
     * @param order
     * @return {Promise<void>}
     */
    static updateTask = async (task, order) => {
        await fetch(this.url + "/api/task/" + task.id, {
            method: "PATCH", body: JSON.stringify({
                label: task.label,
                description: task.description,
                ended: task.ended,
                order: order,
                isValidate: task.isValidate,
            }), headers: {
                Accept: "application/json; charset=UTF-8",
                "Content-type": "application/json; charset=UTF-8",
                Authorization: this.oauth.token_type + " " + this.oauth.access_token,
            },
        });
    };

    /**
     * Fetch pour supprimer une tâche
     * @param id - id de la tâche
     * @return {Promise<void>}
     */
    static deleteTask = async (id) => {
        await fetch(this.url + "/api/task/" + id, {
            method: "DELETE", headers: {
                Authorization: this.oauth.token_type + " " + this.oauth.access_token,
            },
        });
    };

    /**
     * Sert à vérifier si l'utlisateur a déjà été connecté il y a moins de 14 jours à l'aide du localStorage et set les token
     * SI oui, retourne true
     * SINON, retourne false
     * @return {Promise<boolean>}
     */
    static getStorage = async () => {
        const refreshToken = JSON.parse(localStorage.getItem("token")); //Récupère le refresh token dans le local storage
        if (refreshToken) {
            //Vérifie si il y en a un, si il y en a pas, return false
            Coopernet.oauth.refresh_token = refreshToken; //Affecte la valeur du token récupéré
            if (await Coopernet.setRefreshToken()) {
                //Si la création d'un un nouveau token complet à l'aide du refresh_token fonctionne :
                localStorage.setItem("token", JSON.stringify(Coopernet.oauth.refresh_token)); //Le refresh_token a été rafraîchi, donc je stock le nouveau
                return true;
            }
        }
        return false;
    };
}

export default Coopernet;
