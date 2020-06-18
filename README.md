# Documentación Bot Auditoria Smart

A continuación se describirán los pasos necesarios para la instalación y puesta en marcha del chatbot de Auditoría en Telegram. De igual forma, se explicará a detalle el código empleado.

# Preparación del proyecto

Para instalar las dependencias, escribir en una terminal:

```
npm install
```

### Ejecutar el proyecto

```
npm run dev
```

### Estructura del proyecto

```
$ tree
.
├── chatbot
│   ├── helpers
|	|	├── structFunctions.js
│   ├── Telegram
|	└──	├── telegramBot.js
├── db
│   ├── data
|	|	├── dataDePrueba.js
│   ├── Auditorias.js
│   ├── Cuestionarios.js
│   ├── Detalle_auditorias.js
│   ├── index.js
│   ├── Preguntas.js
│   └── Respuestas.js
├── config.js
├── server.js
└── README.md
```

# Funciones

A continuación se listaran el conjunto de funciones de /chatbot/Telegram/telegramBot.js.

## bot.on("message",async (msg) => { ... })

Método encargado de recepcionar los mensajes entrantes.

## saveUserInformation(msg)

Función encargada de almacenar la información de un usuario de Telegram.

## getUserData(userId)

Función encargada de recuperar la información almacenada de un usuario de Telegram.

## handleDialogFlowResponse(sender, response)

Función encargada de gestionar la respuesta de Dialogflow. Se verifica si Dialogflow respondio con mensajes + actions o solo mensajes.

## handleDialogFlowAction(sender,action,messages,contexts,parameters)

Función encargada de gestionar los intents con [actions](<[https://cloud.google.com/dialogflow/docs/intents-actions-parameters](https://cloud.google.com/dialogflow/docs/intents-actions-parameters)>).

> **Nota:** Se puede tratar esta función como la más importante del proyecto, puesto que aquí se tiene total control de un intent emparejado que cuente con un action.
>
> > **Nota 2:** En esta función están presentes todas las funciones para hacer llamado a la base de datos, y es donde se controla el flujo de la conversación.

## sendToDialogFlow(senderID, messageText)

Función encargada de enviar el mensaje recibido en Telegram a Dialogflow.

> **Nota:** Se estará empleado esta función para, convenientemente, desencadenar exactamente el intent que se desee sin que el usuario haya explícitamente mandado un mensaje.

## sendTypingOn(senderID)

Función encargada de simular que el bot está escribiendo un mensaje.

## handleMessage(message, sender)

Función encargada de verificar la naturaleza de un mensaje (si se trata de solo texto, es respuesta rápida, es imagen, etc) y activar la función correspondiente.

## handleDialogflowPayload(senderID, payload)

Función encargada desestructurar texto en formato JSON proveniente de Dialogflow.

## sendButtons(senderID, title, buttons)

Función encargada de servir un conjunto de botones de un elemento tipo Card.

##### El formato de código para generar un botón es:

```
{
text: "Texto del botón",
url: "Alguna URL",
}
```

La función recibe un array de botones con el formato especificado anteriormente.

## sendQuickReply(senderID, title, replies)

Función encargada de enviar respuestas rápidas al usuario.

##### El formato de código para un reply del parámetro replies es:

```
{
text:  "Si",
callback_data:  "Si",
}
La función recibe un array de replies con el formato especificado anteriormente.
```

## sendImageMessage(senderID, url)

Función encargada de enviar imágenes.

## handleMessages(messages, sender)

Función encargada de enviar un conjunto de mensajes provenientes de Dialogflow .

## handleCardMessages(messages, senderID)

Función encargada de enviar un conjunto de cards en simultáneo.

## sendGenericMessage(senderID, element)

Función encargada de enviar un mensaje tipo card.

## sendTextMessage(senderID, message)

Envía un mensaje de texto simple al usuario. Soporta etiquetas html como <b></b>

## isDefined(obj)

Determina si el objeto que recibe como parámetro está definido o no.
