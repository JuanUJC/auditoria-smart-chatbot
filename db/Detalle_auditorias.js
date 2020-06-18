const db = require(".");

//Modulo de funciones de tabla Detalle_auditorias
let create = (id_auditoria, id_pregunta, id_respuesta) => {
  return new Promise((resolve, reject) => {
    db.query(
      "insert into detalle_auditorias(id_auditoria,id_pregunta,id_respuesta) values($1,$2,$3)",
      [id_auditoria, id_pregunta, id_respuesta],
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
