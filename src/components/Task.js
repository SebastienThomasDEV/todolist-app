function Task({ task, showUpdateFormTask, deleteTask, validateTask }) {
  return (
    <div className="d-flex justify-content-between align-items-baseline border m-2 p-3">
      <h3
        className={
          parseInt(task.isValidate) ? "text-decoration-line-through" : ""
        }
      >
        {task.label}
      </h3>
      <p>{task.description}</p>
      <p>{task.ended}</p>
      <div>
        <button
          className={
            parseInt(task.isValidate)
              ? "btn btn-danger me-3"
              : "btn btn-success me-3"
          }
          onClick={() => validateTask(task.id)}
        >
          {+task.isValidate ? "Invalider" : "Valider"}
        </button>
        <button
          onClick={() => showUpdateFormTask(task)}
          className="btn btn-primary me-1"
        >
          Mettre à jour
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          className="btn btn-secondary"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export default Task;
