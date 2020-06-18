const db = require(".");
//Modulo de funciones de tabla Usuarios
let addUser = (nombres, apellidos, id_telegram) => {
  db.query(
    "select * from usuarios where id_telegram=$1",
    [id_telegram],
    (err, res) => {
      if (err) {
        console.log(err);
        return;
      }
      let userExists = res.rows.length;
      if (userExists === 0) {
        db.query(
          "insert into usuarios(nombres,apellidos,id_telegram) values($1,$2,$3)",
          [nombres, apellidos, id_telegram],
          (err, res) => {
            if (err) {
              console.log(err);
              return;
            }
            console.log("Se creó un nuevo usuario exitosamente");
          }
        );
      }
    }
  );
};

module.exports = {
  addUser,
};
