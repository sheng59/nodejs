require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

// ===== 設定 =====
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// ===== 中間件 =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== 首頁 =====
app.get('/', (req, res) => {
    res.send('LINE Bot Server on Vercel 🚀');
});

// ===== 檢查環境變數（除錯用）=====
app.get('/env', (req, res) => {
    res.json({
        CHANNEL_ACCESS_TOKEN: CHANNEL_ACCESS_TOKEN ? '✓ 已設定' : '✗ 未設定',
        CHANNEL_ACCESS_TOKEN_LENGTH: CHANNEL_ACCESS_TOKEN ? CHANNEL_ACCESS_TOKEN.length : 0,
        NODE_ENV: process.env.NODE_ENV
    });
});

// ===== 發送訊息 =====
app.post('/sendmessage', async (req, res) => {
    try {
        const orderData = req.body;
        
        // 驗證必要欄位
        const requiredFields = ['userId', 'message'];
        for (const field of requiredFields) {
            if (!(field in orderData)) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`,
                    message: 'Please provide all required order information'
                });
            }
        }
        
        // 設定 LINE API 請求
        const headers = {
            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        };
        
        const body = {
            to: orderData.userId,
            messages: [{
                type: 'text',
                text: orderData.message
            }]
        };
        
        // 發送請求
        const response = await axios.post(
            'https://api.line.me/v2/bot/message/push',
            body,
            { headers }
        );
        
        // 回傳成功
        res.status(response.status).json({
            status: 'success',
            message: 'Message sent to LINE',
            formatted_message: orderData.message
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.response) {
            // LINE API 錯誤
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

// ===== 匯出為 Vercel Serverless Function（重要！）=====
module.exports = app;
