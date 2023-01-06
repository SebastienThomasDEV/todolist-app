function FormTask({ toUpdateTask, handleSubmit, hideForm }) {
  // conditionnel qui check si la valeur de l'input est null et affiche le bon formulaire
  const InputLabel = toUpdateTask?.label ? (
    <input id="label" type="text" defaultValue={toUpdateTask.label} />
  ) : (
    <input id="label" type="text" />
  );

  // conditionnel qui check si la valeur de l'input est null et affiche le bon formulaire
  const InputDescription = toUpdateTask?.description ? (
    <textarea
      id="description"
      cols="30"
      rows="10"
      defaultValue={toUpdateTask.description}
    ></textarea>
  ) : (
    <textarea id="description" cols="30" rows="10"></textarea>
  );

  // conditionnel qui check si la valeur de l'input est null et affiche le bon formulaire
  const InputEnded = toUpdateTask?.ended ? (
    <input id="ended" type="date" defaultValue={toUpdateTask.ended} />
  ) : (
    <input id="ended" type="date" />
  );

  // retourne le bon formulaire apres avoir vérifié les valeurs
  return (
    <form className="d-flex flex-column" onSubmit={handleSubmit}>
      <label className="d-flex flex-column">
        Nom de la tâche
        {InputLabel}
      </label>
      <label className="d-flex flex-column">
        Description de la tâche
        {InputDescription}
      </label>
      <label className="d-flex flex-column">
        Date de fin de tâche
        {InputEnded}
      </label>
      <input
        className="btn btn-success w-50 my-1 mt-3"
        type="submit"
        value={toUpdateTask ? "Mettre à jour" : "Ajouter"}
      />
      <button className="btn btn-danger w-50 my-1" onClick={hideForm}>
        Annuler
      </button>
    </form>
  );
}

export default FormTask;
