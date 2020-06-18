const express = require("express");
const bodyParser = require("body-parser");
const app = express();

//public path
app.use(express.static(__dirname + "/public"));

const port = process.env.PORT || 3000;
//environment variables
require("dotenv").config();

// parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "20mb",
  })
);
// parse application/json
app.use(bodyParser.json());

//chatbot telegram
require("./chatbot/Telegram/telegramBot");

app.get("/", async (req, res) => {
  res.json({ message: "Chatbot Online!" });
});

app.listen(port, () => {
  console.log(`Escuchando peticiones en el puerto ${port}`);
});
