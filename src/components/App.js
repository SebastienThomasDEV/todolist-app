import { useEffect, useState } from "react";
import Task from "./Task";
import Coopernet from "../services/Coopernet";
import FormTask from "./FormTask";

function App() {
  const [displayError, setDisplayError] = useState("");
  // State pour la gestion de la connexion
  const [isConnected, setIsConnected] = useState(false);
  // State pour la gestion des tâches
  const [tasks, setTasks] = useState([]);
  // State pour la gestion des formulaires
  // créer un objet dans le state pour pouvoir changer de type de formulaire
  // créer un sous-objet pour gérer les données de l'update
  const [displayFormTask, setDisplayFormTask] = useState({
    type: "none",
    toUpdateTask: {},
  });

  // Fonction use effect qui gére la connexion et change la valeur du state
  useEffect(() => {
    const connect = async () => {
      if (await Coopernet.getStorage()) {
        setIsConnected(true);
      }
    };
    connect();
  }, []);

  // Fonction use effect qui quand l'utilisateur est connecté récupére les tâches associé au compte
  useEffect(() => {
    const getTasks = async () => {
      if (isConnected) {
        setTasks(await Coopernet.getTasks());
      }
    };
    getTasks();
  }, [isConnected]);

  //Fonction qui gére la persistance de la connexion de l'utilisateur et la récupération les tâches
  const handleSubmitConnect = async (e) => {
    e.preventDefault();
    if (await Coopernet.setOAuthToken()) {
      setIsConnected(true);
      setTasks(await Coopernet.getTasks());
    }
  };

  //Fonction qui gére la deconnexion de l'utilisateur
  const handleClickDisconnect = () => {
    // objet qui stocke le token
    Coopernet.oauth = {};
    // efface le token
    localStorage.removeItem("token");
    setIsConnected(false);
    // efface toutes les taches
    setTasks([]);
    // met le type du formulaire à la valeur de base
    setDisplayFormTask({
      type: "none",
      toUpdateTask: {},
    });
  };

  // fonction qui affiche le formulaire de modification de la tache selectionné
  const handleClickShowUpdateFormTask = (toUpdateTask) => {
    setDisplayFormTask((displayFormTask) =>
      displayFormTask.type === "update" &&
      displayFormTask.toUpdateTask.id === toUpdateTask.id
        ? { type: "none", toUpdateTask: {} }
        : { type: "update", toUpdateTask: toUpdateTask }
    );
  };

  // fonction qui gére la soumission de formulaire de modification de la tache selectionné
  const handleSubmitUpdateFormTask = (e) => {
    e.preventDefault();
    const toUpdateTask = { ...displayFormTask.toUpdateTask };
    toUpdateTask.label = document.querySelector("#label").value;
    toUpdateTask.description = document.querySelector("#description").value;
    toUpdateTask.ended = document.querySelector("#ended").value;

    if (
      toUpdateTask.label === "" ||
      toUpdateTask.ended === "" ||
      toUpdateTask.description === ""
    ) {
      handleDisplayFormError();
    } else {
      setTasks(
        tasks.map((task) => (task.id === toUpdateTask.id ? toUpdateTask : task))
      );
      Coopernet.updateTask(toUpdateTask, toUpdateTask.order);
      setDisplayFormTask({ type: "none", toUpdateTask: {} });
    }
  };

  // fonction qui gére l'affichage du formulaire de création d'une tache
  const handleClickShowAddFormTask = () => {
    setDisplayFormTask({
      type: "add",
      toUpdateTask: {},
    });
  };

  // fonction qui gére la soumission de formulaire de création de tâche
  const handleSubmitAddFormTask = async (e) => {
    e.preventDefault();
    const newTask = {
      label: document.querySelector("#label").value,
      description: document.querySelector("#description").value,
      ended: document.querySelector("#ended").value,
    };
    if (
      newTask.label === "" ||
      newTask.ended === "" ||
      newTask.description === ""
    ) {
      handleDisplayFormError();
    } else {
      const idAndCreated = await Coopernet.addTask(newTask, tasks.length);
      newTask.id = idAndCreated.id;
      setTasks([...tasks, newTask]);
      setDisplayFormTask({ type: "none", toUpdateTask: {} });
    }
  };

  // fonction qui gére la suppression d'une tâche
  const handleClickDeleteTask = (id) => {
    setTasks((tasks) => tasks.filter((task) => task.id !== id));
    Coopernet.deleteTask(id);
  };

  // fonction qui cache le formulaire selectionné
  const handleClickHideFormTask = (e) => {
    e.stopPropagation();
    setDisplayFormTask((displayFormTask) => ({
      type: "none",
      toUpdateTask: {},
    }));
  };

  // fonction qui valide la tache ou l'invalide
  const handleClickValidateTask = (id) => {
    setTasks(() =>
      tasks.map((task) => {
        if (task.id === id) {
          task.isValidate = +!+task.isValidate;
          Coopernet.updateTask(task, task.order);
        }
        return task;
      })
    );
  };

  const handleDisplayFormError = () => {
    setDisplayError("!!! le formulaire n'est pas valide !!! ");
    setTimeout(() => {
      setDisplayError("");
    }, 2000);
  };

  if (isConnected) {
    return (
      <main className="container">
        <header className="d-flex justify-content-between align-items-center">
          <h1>Liste de tâches</h1>
          <button className="btn btn-secondary" onClick={handleClickDisconnect}>
            Déconnexion
          </button>
        </header>
        <div className="text-danger mt-5 text-uppercase">{displayError}</div>
        {displayFormTask.type === "none" && (
          <button
            className="btn btn-danger"
            onClick={handleClickShowAddFormTask}
          >
            Ajouter une tâche
          </button>
        )}
        {displayFormTask.type === "add" && (
          <FormTask
            hideForm={handleClickHideFormTask}
            handleSubmit={handleSubmitAddFormTask}
            // fonction pour afficher une erreur dans le formulaire
            handleDisplayFormError={handleDisplayFormError}
          />
        )}
        {displayFormTask.type === "update" && (
          <FormTask
            key={displayFormTask.toUpdateTask.id}
            toUpdateTask={displayFormTask.toUpdateTask}
            handleSubmit={handleSubmitUpdateFormTask}
            hideForm={handleClickHideFormTask}
            // fonction pour afficher une erreur dans le formulaire
            handleDisplayFormError={handleDisplayFormError}
          />
        )}

        <div className="m-3">
          <h2 className="ms-3">Tâches en cours</h2>
          {tasks
            .filter((task) => !parseInt(task.isValidate))
            .map((task) => (
              <Task
                key={task.id}
                task={task}
                showUpdateFormTask={handleClickShowUpdateFormTask}
                deleteTask={handleClickDeleteTask}
                validateTask={handleClickValidateTask}
              />
            ))}
        </div>
        <div className="m-4">
          <h2 className="ms-3">Tâches validées</h2>
          {tasks
            .filter((task) => parseInt(task.isValidate))
            .map((task) => (
              <Task
                key={task.id}
                task={task}
                showUpdateFormTask={handleClickShowUpdateFormTask}
                deleteTask={handleClickDeleteTask}
                validateTask={handleClickValidateTask}
              />
            ))}
        </div>
      </main>
    );
  }

  // formulaire de connexion
  return (
    <div className="container">
      <h1>Formulaire de connexion</h1>
      <form className="w-50" onSubmit={handleSubmitConnect}>
        <label className="d-flex flex-column">
          Nom d'utilisateur :
          <input
            onChange={(e) => Coopernet.setUsername(e.target.value)}
            type="text"
          />
        </label>
        <label className="d-flex flex-column">
          Mot de passe :
          <input
            onChange={(e) => Coopernet.setPassword(e.target.value)}
            type="text"
          />
        </label>
        <input
          className="mt-2 btn btn-secondary"
          value={"Se connecter"}
          type="submit"
        />
      </form>
    </div>
  );
}

export default App;
