require("dotenv").config();
const fs = require("fs").promises;
const fsS = require("fs");

const TelegramBot = require("node-telegram-bot-api");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

let userState = {};
let callbackQueryTEMP;
let step = 0;

// Listen for any kind of message. There are different kinds of
// messages.
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;

// var options = {
//     reply_markup: JSON.stringify({
//       inline_keyboard: [
//         [{ text: 'Some button text 1', callback_data: '1' }, { text: 'Some button text 2', callback_data: '2' }, { text: 'Some button text 3', callback_data: '3' }],
//       ]
//     })
//   };
//       bot.sendMessage(chatId, 'Enter your name: ', options);

// });
const read = async () => {
  if (fsS.existsSync("./data.json")) {
    let file = await fs.readFile("./data.json", "utf8");
    file = JSON.parse(file);
    userState = file;
  }
};

const overwriteFile = async () => {
  await fs.writeFile(
    "./data.json",
    JSON.stringify(userState, null, 2, { encoding: "utf8", flag: "w" })
  );
};

read();

console.log(userState);

// const description = () => {

// }

const choseSex = async (msgName) => {
  try {
    console.log(msgName);
    if (msgName.text.includes("/")) {
      await bot.sendMessage(msgName.chat.id, "Wrong nickname try again");
      bot.removeListener("message", choseSex);

      return;
    }

    userState[msgName.chat.id] = {
      name: msgName.text,
      username: msgName.chat.username,
      liked: [],
    };

    var options = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: "Male", callback_data: "1" },
            { text: "Female", callback_data: "2" },
          ],
        ],
      }),
    };
    await bot.sendMessage(msgName.chat.id, "Enter your gender: ", options);
  } catch (error) {
    console.log("Choose error");
  }
};

const addPhoto = async (msg1) => {
  try {
    userState[msg1.chat.id].photo_id = msg1.photo[0].file_id;
    await fs.writeFile(
      "./data.json",
      JSON.stringify(userState, null, 2, "utf-8")
    );
    bot.answerCallbackQuery(callbackQueryTEMP.id, {
      text: "Anketa created",
    });

    bot.removeListener("photo", addPhoto);
  } catch (error) {
    console.log("Error with saving photo");
  }
};

const nextPost = async (msg, filtredEntries, isLike) => {
  try {
    step++;

    if (step >= filtredEntries.length) {
      step = 0;
    }

    var likeOptions = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: "👍", callback_data: "watch" },
            { text: "👎", callback_data: "unwatch" },
          ],
        ],
      }),
    };

    const yesNoOption = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: "👍", callback_data: "watchNext" },
            { text: "👎", callback_data: "removeNext" },
          ],
        ],
      }),
    };

    if (isLike) {
      if (
        userState[filtredEntries[step][0]].liked.every(
          (item) => +item !== +msg.chat.id
        )
      ) {
        userState[filtredEntries[step][0]].liked.push(msg.chat.id);
        overwriteFile();
      }
      console.log(userState);
      await bot.sendMessage(
        filtredEntries[step][0],
        `Someone has liked you\nYou have ${
          userState[filtredEntries[step][0]].liked.length
        } likes!\nDo you want to see these people?`,
        yesNoOption
      );
    }

    var options = {
      caption: `Name: ${filtredEntries[step][1].name}\nSex: ${filtredEntries[step][1].sex}:`,
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: "❤️", callback_data: "like" },
            { text: "🤮", callback_data: "unlike" },
          ],
        ],
      }),
    };

    await bot.sendPhoto(msg.chat.id, filtredEntries[step][1].photo_id, options);
  } catch (e) {
    console.log("next post error ", e);
    step = 0;
  }
};

async function init() {
  bot.setMyCommands([
    {
      command: "/start",
      description: "Create anketa",
    },
    {
      command: "/watchankets",
      description: "Watch another ankets",
    },
    {
      command: "/checkme",
      description: "Check your anketa",
    },
    {
      command: "/resetmyanket",
      description: "Reset my own anket",
    },
  ]);

  bot.onText(/\/start/, async (msg) => {
    try {
      const chatId = msg.chat.id;

      const name = msg.text;

      if (!userState[chatId]) {
        await bot.sendMessage(chatId, "Welcome! Please enter your name:");
        bot.on("message", choseSex);
        return;
      } else {
        await bot.sendMessage(
          chatId,
          `Nice to meet you again, ${userState[chatId].name}!`
        );
      }
    } catch (_) {
      console.log("start error");
    }
  });

  bot.onText(/\/resetmyanket/, async (msg) => {
    try {
      const chatId = msg.chat.id;

      const name = msg.text;

      if (userState[chatId]) {
        await bot.sendMessage(chatId, "Please enter your new name:");
        bot.on("message", choseSex);
        return;
      }
    } catch (e) {
      console.log("reset error ", e);
    }
  });

  bot.on("callback_query", (callbackQuery) => {
    try {
      callbackQueryTEMP = callbackQuery;
      const action = callbackQuery.data;
      const msg = callbackQuery.message;
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      };

      const entries = Object.entries(userState);
      const filtredEntries = entries.filter(
        (item) => +item[0] !== +msg.chat.id
      );

      if (action === "1") {
        userState[msg.chat.id].sex = "Male";
        bot.editMessageText(":)", opts);
      }

      if (action === "2") {
        userState[msg.chat.id].sex = "Female";
        bot.editMessageText(":)", opts);
      }

      if (action === "like") {
        nextPost(msg, filtredEntries, true);
      }

      if (action === "unlike") {
        nextPost(msg, filtredEntries, false);
      }

      if (action === "watch") {
        bot.sendMessage(filtredEntries[step][0], "Send your photo: ");
      }

      bot.removeListener("message", choseSex);

      if (action === "1" || action === "2") {
        bot.sendMessage(msg.chat.id, "Send your photo: ");
      }

      if (action === "watchNext") {
        if (userState[filtredEntries[step][0]].liked[0]) {
          // console.log();
          bot.sendMessage(
            msg.chat.id,
            `@${
              userState[userState[filtredEntries[step][0]].liked[0]].username
            }`
          );
          console.log(
            userState[userState[filtredEntries[step][0]].liked[0]].username
          );
          userState[filtredEntries[step][0]].liked.shift();
          overwriteFile();
        } else {
          bot.sendMessage(msg.chat.id, `You dont have likes`);
        }
      }

      if (action === "removeNext") {
        if (userState[filtredEntries[step][0]].liked[0]) {
          userState[filtredEntries[step][0]].liked.shift();
          overwriteFile();
        } else {
          bot.sendMessage(msg.chat.id, `You dont have likes`);
        }
        console.log(userState[filtredEntries[step][0]].liked);
      }

      bot.on("photo", addPhoto);
    } catch (e) {
      console.log(e);
    }
  });

  bot.onText(/\/checkme/, async (msg) => {
    try {
      console.log(userState);
      console.log(msg);
      if (userState[msg.chat.id]) {
        const option = {
          caption: `Name: ${userState[msg.chat.id].name}\nSex: ${
            userState[msg.chat.id].sex
          }`,
        };
        await bot.sendPhoto(
          msg.chat.id,
          userState[msg.chat.id].photo_id,
          option
        );
      }
    } catch (e) {
      console.log("check me error", e);
    }
  });

  bot.onText(/\/watchankets/, async (msg) => {
    try {
      const entries = Object.entries(userState);
      const filtredEntries = entries.filter(
        (item) => +item[0] !== +msg.chat.id
      );

      var options = {
        caption: `Name: ${filtredEntries[step][1].name}\nSex: ${filtredEntries[step][1].sex}`,
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: "❤️", callback_data: "like" },
              { text: "🤮", callback_data: "unlike" },
            ],
          ],
        }),
      };
      await bot.sendPhoto(
        msg.chat.id,
        filtredEntries[step][1].photo_id,
        options
      );
    } catch (e) {
      console.log("watch anket error", e);
    }
  });
}

init();
