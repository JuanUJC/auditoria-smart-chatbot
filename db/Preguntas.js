const db = require(".");

//Modulo de funciones de tabla Preguntas

let listByOrder = (id_cuestionario, order) => {
  return new Promise((resolve, reject) => {
    db.query(
      "select * from preguntas where id_cuestionario=$1 and orden=$2",
      [id_cuestionario, order],
      (err, res) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        resolve(res.rows);
      }
    );
  });
};

let listByCuestionarioId = (id_cuestionario) => {
  return new Promise((resolve, reject) => {
    db.query(
      "select * from preguntas where id_cuestionario=$1",
      [id_cuestionario],
      (err, res) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        resolve(res.rows);
      }
    );
  });
};

let create = (id_cuestionario) => {
  return new Promise((resolve, reject) => {
    db.query(
      "insert into auditorias(id_cuestionario) values($1)",
      [id_cuestionario],
      (err, res) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        resolve(res.rows);
      }
    );
  });
};

module.exports = {
  listByCuestionarioId,
  listByOrder,
  create,
};
