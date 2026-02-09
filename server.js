require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

// ===== 設定 =====
const PORT = process.env.PORT || 8000;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// ===== 中間件 =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== 首頁路由 =====
app.get('/', (req, res) => {
    res.send('Hello Node.js - LINE Bot Server');
});

// ===== 檢查環境變數路由（除錯用）=====
app.get('/env', (req, res) => {
    res.json({
        CHANNEL_ACCESS_TOKEN: CHANNEL_ACCESS_TOKEN ? '✓ 已設定' : '✗ 未設定',
        CHANNEL_ACCESS_TOKEN_LENGTH: CHANNEL_ACCESS_TOKEN ? CHANNEL_ACCESS_TOKEN.length : 0,
        NODE_ENV: process.env.NODE_ENV
    });
});

// ===== 發送 LINE 訊息路由 =====
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
        
        // 檢查 CHANNEL_ACCESS_TOKEN 是否存在
        if (!CHANNEL_ACCESS_TOKEN) {
            console.error('❌ CHANNEL_ACCESS_TOKEN 未設定！');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'CHANNEL_ACCESS_TOKEN 未設定'
            });
        }
        
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
        
        // 發送請求到 LINE API（修正：移除 URL 末尾空格）
        const response = await axios.post(
            'https://api.line.me/v2/bot/message/push',  // ← 修正：移除空格
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
        console.error('❌ Error sending message:', error.message);
        
        if (error.response) {
            // LINE API 回傳的錯誤
            console.error('LINE API Response:', error.response.data);
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

// ===== 啟動伺服器 =====
app.listen(PORT, () => {
    console.log(`🚀 Node server is running on port ${PORT}...`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 LINE Channel Access Token: ${CHANNEL_ACCESS_TOKEN ? '✓ 已設定' : '✗ 未設定'}`);
    if (CHANNEL_ACCESS_TOKEN) {
        console.log(`   Token 長度: ${CHANNEL_ACCESS_TOKEN.length} characters`);
    }
});
