const db = require(".");

//Modulo de funciones de tabla Respuestas

let create = (response, observation = " ") => {
  return new Promise((resolve, reject) => {
    db.query(
      "insert into respuestas(respuesta,observacion) values($1,$2) RETURNING *",
      [response, observation],
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
  create,
};
