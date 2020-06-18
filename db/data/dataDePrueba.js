const db = require("..");

//Datos de ejemplo para el chatbot auditor - Poblado de tablas cuestionarios y preguntas

let cuestionarios = [
  "MINICOMPUTADORES E INFORMÁTICA DISTRIBUIDA. RIESGO EN LA EFICACIA DEL SERVICIO INFORMÁTICO",
];

let preguntas = [
  "Existen planes a largo plazo para el departamento de informática.",
  "Valore la conexión de esos planes con los planes generales de la empresa.",
  "Cubren los piares del D.l. los objetivo« a largo plazo dc la empresa, valórelo.",
  "Existen planes a largo pia/o pira el departamento de informática.",
  "Valore la conexión de esos planes con los planes generales de la empresa",
  "Cubren los planes del D.l. k« objetivos a cono plazo de la empresa,valórelo.",
];

cuestionarios.forEach((cuestionario) => {
  db.query(
    `insert into cuestionarios(nombre) values('${cuestionario}')`,
    (err, res) => {
      if (err) {
        return console.log(err);
      }
      console.log("Se terminó de poblar la tabla cuestionarios", res.rows);
    }
  );
});

preguntas.forEach((pregunta, index) => {
  db.query(
    `insert into preguntas(pregunta,orden,id_cuestionario) values('${pregunta}',${
      index + 1
    },1)`,
    (err, res) => {
      if (err) {
        return console.log(err);
      }
      console.log("Se terminó de poblar la tabla preguntas", res.rows);
    }
  );
});
