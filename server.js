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

module.exports = app;
