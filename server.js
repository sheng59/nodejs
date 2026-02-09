require('dotenv').config()

const express = require('express');
const axios = require('axios');

var app = express();

const PORT = process.env.PORT || 8000;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
    res.send(`${CHANNEL_ACCESS_TOKEN}`);
});  

app.post('/sendmessage', async (req, res) => {
	try {
        const orderData = req.body;
        
        // 驗證必要欄位
        const requiredFields = ['userId', 'message'];
        for (const field of requiredFields) {
            if (!orderData[field]) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`,
                    message: 'Please provide all required order information'
                });
            }
        }
        
        const { userId, message } = orderData;
        
        // 設定 LINE API 請求
        const headers = {
            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        };
        
        const body = {
            to: userId,
            messages: [{
                type: 'text',
                text: message
            }]
        };
        
        // 發送請求到 LINE API
        const response = await axios.post(
            'https://api.line.me/v2/bot/message/push',
			//'https://api.line.me/v2/bot/message/broadcast',
            body,
            { headers }
        );
        
        res.json({
            status: 'success',
            message: 'Message sent to LINE',
            userId: userId,
            response: response.data
        });
        
    } catch (error) {
        console.error('Error sending message:', error.message);
        
        if (error.response) {
            // LINE API 回傳的錯誤
            return res.status(error.response.status).json({
                error: error.response.data,
                message: '發送失敗 - LINE API 錯誤'
            });
        }
        
        // 其他錯誤
        res.status(500).json({
            error: error.message,
            message: '發送失敗'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Node server is running on port ${PORT}...`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 LINE Channel Access Token: ${CHANNEL_ACCESS_TOKEN ? '✓ 已設定' : '✗ 未設定'}`);
});
