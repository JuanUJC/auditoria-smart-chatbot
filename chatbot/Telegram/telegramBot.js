process.env.NTBA_FIX_319 = 1;
const config = require("../../config"); //Archivo configuracion Bot
const TelegramBot = require("node-telegram-bot-api"); //Importante - libreria Telegram
const dialogflow = require("../dialogflow");
const { structProtoToJson } = require("../helpers/structFunctions");

// Llamada a funciones de BD
const cuestionariosService = require("../../db/Cuestionarios");
const auditoriasService = require("../../db/Auditorias");
const preguntasService = require("../../db/Preguntas");
const respuestasService = require("../../db/Respuestas");
const detalleAuditoriasService = require("../../db/Detalle_auditorias");
const usuariosService = require("../../db/Usuarios");

const users = []; //convert to database
// replace the value below with the Telegram token you receive from @BotFather
const token = config.TELEGRAMTOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
  polling: true,
});

bot.on("callback_query", async (action) => {
  let msg = action.data;
  let senderID = action.from.id;
  await sendTextMessage(senderID, "<b>Seleccionaste:</b> " + msg);
  console.log("enviando a dialogflow: ", msg, senderID);
  await sendToDialogFlow(senderID, msg);
});

// Función para recibir los mensajes recibidos por el Chatbot
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const sender = msg.from.id;
  const message = msg.text;
  //check if user was registered
  saveUserInformation(msg);
  console.log("mensaje recibido: ", msg);
  await sendToDialogFlow(sender, message);
});

function saveUserInformation(msg) {
  let userId = msg.from.id;
  let nombres = msg.from.first_name;
  let apellidos = msg.from.last_name;
  if (users.findIndex((user) => user.id === userId) === -1) {
    users.push({
      id: userId,
      first_name: nombres,
      last_name: apellidos,
    });
    usuariosService.addUser(nombres, apellidos, userId);
  }
  return;
}

function getUserData(userId) {
  //funcion que retorna los datos del usuario por ID de telegram
  return users.find((user) => user.id === userId);
}

async function handleDialogFlowResponse(sender, response) {
  let responseText = response.fulfillmentMessages.fulfillmentText;
  let messages = response.fulfillmentMessages;
  let action = response.action;
  let contexts = response.outputContexts;
  let parameters = response.parameters;

  if (isDefined(action)) {
    handleDialogFlowAction(sender, action, messages, contexts, parameters);
  } else if (isDefined(messages)) {
    console.log("se entrara a handleMessages");
    handleMessages(messages, sender);
  } else if (responseText == "" && !isDefined(action)) {
    //dialogflow could not evaluate input.
    sendTextMessage(
      sender,
      "I'm not sure what you want. Can you be more specific? gaa"
    );
  } else if (isDefined(responseText)) {
    console.log("se mandara a sendTextMessage");
    sendTextMessage(sender, responseText);
  }
}

async function handleDialogFlowAction(
  sender,
  action,
  messages,
  contexts,
  parameters
) {
  let msg = "",
    id_cuestionario,
    id_auditoria,
    id_pregunta,
    id_ultima_respuesta,
    preguntas,
    ordenPregunta;
  switch (action) {
    case "Test-Intent.action":
      sendTextMessage(sender, "Este mensaje fue enviado desde el código");
      break;
    case "EmpezarAuditoria.action":
      await handleMessages(messages, sender);
      await sendToDialogFlow(sender, "ListarCuestionarios");
      break;
    case "ListadoCuestionarios.action":
      await handleMessages(messages, sender);
      msg = "";
      let cuestionarios = await cuestionariosService.list();
      cuestionarios.forEach((cuestionario) => {
        msg += `<b>${cuestionario.id}.-</b> ${cuestionario.nombre}\n`;
      });
      await sendTextMessage(sender, msg);
      await sendTextMessage(
        sender,
        "Por favor, indícame el número del cuestionario para comenzar..."
      );
      break;
    case "SeleccionCuestionario.action":
      await handleMessages(messages, sender);
      id_cuestionario = parameters.fields.id_cuestionario.numberValue;
      id_auditoria = (await auditoriasService.create(id_cuestionario))[0].id;
      await sendToDialogFlow(sender, "EmpezarCuestionario " + id_auditoria); //empezamos con la pregunta 1
      break;
    case "EmpezarCuestionario.action":
      await handleMessages(messages, sender);
      id_cuestionario =
        contexts[0].parameters.fields.id_cuestionario.numberValue;
      id_auditoria = parameters.fields.id_auditoria.numberValue;
      console.log("el id de la auditoria: ", id_auditoria);
      //empezando cuestionario
      preguntas = await preguntasService.listByCuestionarioId(id_cuestionario);
      await sendTextMessage(
        sender,
        `*Consta de ${preguntas.length} preguntas:.`
      );
      await sendToDialogFlow(sender, "pregunta 1"); //empezamos con la pregunta 1
      break;
    case "Pregunta-cuestionario.action":
      id_cuestionario =
        contexts[0].parameters.fields.id_cuestionario.numberValue;
      ordenPregunta = parameters.fields.orden.numberValue;
      //empezando cuestionario
      preguntas = await preguntasService.listByOrder(
        id_cuestionario,
        ordenPregunta
      );
      if (preguntas.length > 0) {
        msg += `<b>Pregunta ${ordenPregunta}.-</b> ${preguntas[0].pregunta}`;
        await sendTextMessage(sender, msg);
        let replies = [
          {
            text: "Si",
            callback_data: "Si",
          },
          {
            text: "No",
            callback_data: "No",
          },
          {
            text: "N/A",
            callback_data: "N/A",
          },
        ];
        await sendQuickReply(sender, "<b>¿Cumple?</b>", replies);
      } else {
        await sendTextMessage(
          sender,
          "El cuestionario ha terminado. Ahora puedes generar reportes con los datos recolectados..."
        );
      }

      //
      break;
    case "Respuesta-pregunta.action":
      var ordenPreguntaActual = contexts[0].parameters.fields.orden.numberValue;
      var respuesta = parameters.fields.respuesta.stringValue;
      console.log("el valor de respuesta: ", respuesta);
      if (respuesta == "No" || respuesta == "N/A") {
        sendToDialogFlow(sender, "activarObservacion");
      } else {
        //creando registro en bd de pregunta-respuesta
        id_cuestionario =
          contexts[0].parameters.fields.id_cuestionario.numberValue;
        id_pregunta = (
          await preguntasService.listByOrder(
            id_cuestionario,
            ordenPreguntaActual
          )
        )[0].id;
        id_ultima_respuesta = (await respuestasService.create(respuesta))[0].id;
        id_auditoria = contexts[0].parameters.fields.id_auditoria.numberValue;
        detalleAuditoriasService.create(
          id_auditoria,
          id_pregunta,
          id_ultima_respuesta
        );
        await sendTextMessage(sender, "Respuesta guardada en bd: " + respuesta);
        sendToDialogFlow(sender, `pregunta ${ordenPreguntaActual + 1}`);
      }
      break;
    case "Observacion-pregunta.action":
      handleMessages(messages, sender);
      let observacion = parameters.fields.observacion.stringValue;
      if (isDefined(observacion)) {
        var respuesta = contexts[1].parameters.fields.respuesta.stringValue;
        var ordenPreguntaActual =
          contexts[1].parameters.fields.orden.numberValue;
        id_ultima_respuesta = (
          await respuestasService.create(respuesta, observacion)
        )[0].id;
        //creando registro en bd de pregunta-respuesta
        id_cuestionario =
          contexts[1].parameters.fields.id_cuestionario.numberValue;
        id_pregunta = (
          await preguntasService.listByOrder(
            id_cuestionario,
            ordenPreguntaActual
          )
        )[0].id;
        id_auditoria = contexts[1].parameters.fields.id_auditoria.numberValue;
        detalleAuditoriasService.create(
          id_auditoria,
          id_pregunta,
          id_ultima_respuesta
        );
        await sendTextMessage(sender, "Guardado en base de datos... ");
        sendToDialogFlow(sender, `pregunta ${ordenPreguntaActual + 1}`);
      }
      break;
    default:
      console.log(
        "se mandara el mensaje por defecto de handleDialogFlowAction"
      );
      handleMessages(messages, sender);
      break;
  }
}

async function sendToDialogFlow(senderID, messageText) {
  sendTypingOn(senderID);
  let result = await dialogflow.sendToDialogFlow(
    senderID,
    messageText,
    "TELEGRAM"
  );
  handleDialogFlowResponse(senderID, result);
}

function sendTypingOn(senderID) {
  bot.sendChatAction(senderID, "typing");
}

async function handleMessage(message, sender) {
  console.log("se entro a handleMessage");
  console.log("mensaje: ", message);
  console.log("switch: ", message.message);
  console.log("texto: ", message.text);
  switch (message.message) {
    case "text": //text
      for (const text of message.text.text) {
        if (text !== "") {
          await sendTextMessage(sender, text);
        }
      }
      break;
    case "quickReplies": //quick replies
      let title = message.quickReplies.title;
      console.log("el titulo es:", title);
      let replies = [];
      message.quickReplies.quickReplies.forEach((text) => {
        replies.push({
          text: text,
          callback_data: text,
        });
      });
      sendQuickReply(sender, title, replies);
      break;
    case "image": //image
      await sendImageMessage(sender, message.image.imageUri);
      break;
    case "payload":
      handleDialogflowPayload(sender, message.payload);
      break;
  }
}

function handleDialogflowPayload(senderID, payload) {
  let desestructPayload = structProtoToJson(payload);
  let type = desestructPayload.telegram.attachment.payload.template_type;
  console.log("el mensaje desestructurado: ", desestructPayload);
  switch (type) {
    case "button":
      let text = desestructPayload.telegram.attachment.payload.text;
      let buttons = desestructPayload.telegram.attachment.payload.buttons;
      let formattedButtons = [];
      buttons.forEach((button) => {
        formattedButtons.push({
          text: button.title,
          url: button.url,
        });
      });
      sendButtons(senderID, text, formattedButtons);
      break;

    default:
      console.log("el tipo de payload no se reconoce...");
      break;
  }
}

async function sendButtons(senderID, title, buttons) {
  await bot.sendMessage(senderID, title, {
    reply_markup: {
      inline_keyboard: [buttons],
      resize_keyboard: true,
    },
    parse_mode: "HTML",
  });
}

async function sendQuickReply(senderID, title, replies) {
  await bot.sendMessage(senderID, title, {
    parse_mode: "html",
    reply_markup: {
      inline_keyboard: [replies],
      resize_keyboard: true,
    },
  });
}

async function sendImageMessage(senderID, url) {
  await bot.sendChatAction(senderID, "upload_photo");
  await bot.sendPhoto(senderID, url);
}

async function handleMessages(messages, sender) {
  let timeoutInterval = 1100;
  let previousType;
  let cardTypes = [];
  let timeout = 0;
  for (var i = 0; i < messages.length; i++) {
    if (
      previousType == "card" &&
      (messages[i].message != "card" || i == messages.length - 1)
    ) {
      timeout = (i - 1) * timeoutInterval;
      setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
      cardTypes = [];
      await handleMessage(messages[i], sender);
      // timeout = i * timeoutInterval;
      // setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
    } else if (messages[i].message == "card" && i == messages.length - 1) {
      cardTypes.push(messages[i]);
      timeout = (i - 1) * timeoutInterval;
      setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
      cardTypes = [];
    } else if (messages[i].message == "card") {
      cardTypes.push(messages[i]);
    } else {
      await handleMessage(messages[i], sender);
      // timeout = i * timeoutInterval;
      // setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
    }
    previousType = messages[i].message;
  }
}

async function handleCardMessages(messages, senderID) {
  console.log(
    "se recibio esto en handleCardMessages: ",
    JSON.stringify(messages, null, " ")
  );
  for (let m = 0; m < messages.length; m++) {
    let message = messages[m];
    let buttons = [];
    for (var b = 0; b < message.card.buttons.length; b++) {
      let isLink = message.card.buttons[b].postback.substring(0, 4) === "http";
      let button;
      if (isLink) {
        button = {
          text: message.card.buttons[b].text,
          url: message.card.buttons[b].postback,
        };
      } else {
        button = {
          text: message.card.buttons[b].text,
          callback_data: message.card.buttons[b].postback,
        };
      }
      buttons.push(button);
    }

    let element = {
      title: message.card.title,
      image_url: message.card.imageUri,
      subtitle: message.card.subtitle || " ",
      buttons: buttons,
    };
    console.log("el elemento queda asi: ", element);
    await sendGenericMessage(senderID, element);
  }
}

async function sendGenericMessage(senderID, element) {
  await sendImageMessage(senderID, element.image_url);
  // await sendTextMessage(senderID, `<b>${element.title}</b>`);
  await sendButtons(
    senderID,
    "<b>" + element.title + "</b>" + "\n" + element.subtitle,
    element.buttons
  );
}

let sendTextMessage = async (senderID, message) => {
  console.log("Enviando el mensaje: ", senderID, message);
  await bot.sendMessage(senderID, message, {
    parse_mode: "HTML",
  });
};

function isDefined(obj) {
  if (obj === undefined) {
    return false;
  }

  if (obj === null) {
    return false;
  }
  if (obj === "") {
    return false;
  }
  return true;
}
