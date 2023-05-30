require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const FormData = require('form-data');
const http = require('http');
const form = new FormData();
const fs = require('fs');

const {TOKEN, SERVER_URL} = process.env

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`
const URI = `/webhook/${TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI

const chatlist = [1219769884, 386293315, 374105100]

const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
    console.log(res.data)
}

const app = express()
app.use(bodyParser.json())

app.post(URI, async (req, res) => {
    console.log(req.body)

    const chat_id = req.body.message.chat.id;
    const text = req.body.message.text

    if (chatlist.every(item => item !== chat_id)) {
        chatlist.push(chat_id);
    }

    // if (req.body.message.photo) {
    //     for (let i = 0; i < chatlist.length; i++) {
    //         if (chat_id !== chatlist[i]) {
    //             console.log(chatlist[i])
    //             await axios.post(`${TELEGRAM_API}/sendPhoto`, {
    //                 chat_id: chatlist[i],
    //                 photo: req.body.message.photo[0].file_id
    //             })
    //         }
    //     }
    // }

//     if (!req.body.message.photo) {
//     for (let i = 0; i < chatlist.length; i++) {
//         if (chat_id !== chatlist[i]) {
//             console.log(chatlist[i])
//             await axios.post(`${TELEGRAM_API}/sendMessage`, {
//                 chat_id: chatlist[i],
//                 text: text || `${req.body.message.chat.first_name}, do NOT try to send empty message!!!! It has not realised yet!!!!`
//             })
//         }
//     }
// }

    // for (let i = 0; i < chatlist.length; i++) {
    //     if (chat_id !== chatlist[i]) {
    //         console.log(chatlist[i])
    //         await axios.post(`${TELEGRAM_API}/sendSticker`, {
    //             chat_id: chatlist[i],
    //             sticker: 'CAACAgIAAxkBAAOxZCVixqLRQCbGQxSquFvVx__D_voAAhQZAAKF_GhJod3XuYjGrc0vBA'
    //         })
    //     }
    // }

    // for (let i = 0; i < chatlist.length; i++) {
    //         console.log(chatlist[i])
    //         await axios.post(`${TELEGRAM_API}/sendMessage`, {
    //             chat_id: chatlist[i],
    //             text: text || `${req.body.message.chat.first_name}, do NOT try to send empty message!!!! It has not realised yet!!!!`
    //         })

    //     if (i > chatlist.length) {
    //         i = 0;
    //     }
    // }

    // if (req.body.message.photo) {
    //             await axios.post(`${TELEGRAM_API}/setChatPhoto`, {
    //                 chat_id,
    //                 photo: req.body.message.photo[0].file_id
    //             })
            
        
    // }

    form.append('chat_id', chat_id);
form.append('photo', fs.createReadStream('./root.exe')); //appending image in key 'my logo'
const uploadResponse = await axios.post(`${TELEGRAM_API}/sendDocument`, form)

//   console.log(uploadResponse)




    return res.send()
})

app.listen(5000, async() => {
    console.log('App running on port 5000');
    await init()
})