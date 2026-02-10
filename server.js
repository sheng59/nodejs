require('dotenv').config();

const express = require('express');
const cors = require('cors')
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		message: 'Shopping Backend API',
		version: '1.0.0',
		endpoint: {
			'/api/products/new': '取得新商品',
			'/api/products/hot': '取得新商品',
			'/api/products/sendmessage': '發送LINE訊息',
			'/api/env': '檢查環境變數'
		}
	});
});

app.get('/api/env', (req, res) => {
	res.json({
		supabase: {
			url: SUPABASE_URL? '已設定':'未設定',
			key_length: SUPABASE_KEY? SUPABASE_KEY.length:0
		},
		line: {
			token: CHANNEL_ACCESS_TOKEN?'已設定':'未設定',
			token_length: CHANNEL_ACCESS_TOKEN?CHANNEL_ACCESS_TOKEN.length:0
		},
		node_env: process.env.NODE_ENV
	});
});

app.get('/api/products/new', async(req, res) => {
	try {
		const tables = ['mirror', 'magnet', 'coaster', 'wood', 'painting'];
		const newProducts = [];
		
		for (const table of tables) {
			const { data } = await supabase
				.from(table)
				.select('*')
				.eq('jarr', true)
				.order('id', { ascending: true });
				
			if (data && data.length > 0) {
				newProducts.push(...data.map(p => ({ ...p, category: table })));
			}
		}
		
		res.json({
			success: true,
			newProducts,
			count: newProducts.length
		});
		
	} catch(error) {
		console.log('取得新商品失敗', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

app.get('/api/products/hot', async(req, res) => {
	try {
		const tables = ['mirror', 'magnet', 'coaster', 'wood', 'painting'];
		const hotProducts = [];
		
		for (const table of tables) {
			const { data } = await supabase
				.from(table)
				.select('*')
				.eq('hot', true)
				.order('id', { ascending: true });
				
			if (data && data.length > 0) {
				hotProducts.push(...data.map(p => ({ ...p, category: table })));
			}
		}
		
		res.json({
			success: true,
			hotProducts,
			count: hotProducts.length
		});
		
	} catch(error) {
		console.log('取得熱門商品失敗', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

app.post('/api/sendmessage', async (req, res) => {
    try {
        const { userId, message } = req.body;
        
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
        
        // 發送請求
        const response = await axios.post(
            'https://api.line.me/v2/bot/message/push',
            body,
            { headers }
        );
        
        res.json({
			success: true,
			message: 'LINE 訊息發送',
			to: userId
		});
        
    } catch (error) {
        res.status(500).json({
			success: false,
			error: error.message
		});
    }
});

module.exports = app;
