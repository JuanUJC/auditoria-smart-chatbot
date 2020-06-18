const db = require(".");

//Modulo de funciones de tabla Auditorias
let list = () => {
  return new Promise((resolve, reject) => {
    db.query("select * from auditorias", (err, res) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      resolve(res.rows);
    });
  });
};

let create = (id_cuestionario, descripcion = " ") => {
  return new Promise((resolve, reject) => {
    db.query(
      "insert into auditorias(id_cuestionario,descripcion) values($1,$2) RETURNING *",
      [id_cuestionario, descripcion],
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
  list,
  create,
};
