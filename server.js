require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

app.use(express.json());

app.get('/', (req, res) => {
	res.send('LINE Bot Server on Vercel 🚀');
});

module.exports = app;
