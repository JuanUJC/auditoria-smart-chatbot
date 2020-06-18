const db = require(".");

//Modulo de funciones de tabla Cuestionarios
let list = () => {
  return new Promise((resolve, reject) => {
    db.query("select * from cuestionarios", (err, res) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      resolve(res.rows);
    });
  });
};

module.exports = {
  list,
};
