require('dotenv').config();

const express = require('express');
const cors = require('cors')
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ===== 設定 =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const LINE_USER_ID = process.env.LINE_USER_ID;

// ===== 初始化 =====
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// ===== 首頁 =====
app.get('/', (req, res) => {
	res.json({
		message: 'Shopping Backend API',
		version: '1.0.0',
		endpoint: {
			'GET /api/env': '檢查環境變數',
			'GET /api/products': '取得所有商品',
			'GET /api/products/:category': '取得特定類別商品',
			'GET /api/products/new': '取得新商品',
			'GET /api/products/hot': '取得熱門商品',
			'GET /api/products/search': '搜尋商品',
			'POST /api/orders': '建立訂單',
			'GET /api/orders/:id': '取得訂單資訊',
			'GET /api/orders': '取得所有訂單',
			'POST /api/line/test': '測試LINE訊息',
			'PUT　/api/products/:category/:id/stock': '搜尋商品'
		}
	});
});

// ===== 檢查環境變數 =====
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

// ===== 取得所有商品 =====
app.get('/api/products', async(req, res) => {
	try {
		const tables = ['mirror', 'magnet', 'coaster', 'wood', 'painting'];
		const allProducts = {};
		
		for (const table of tables) {
			const { data, error } = await supabase
				.from(table)
				.select('*')
				.order('id', { ascending: true });
				
			if (error) {
				console.log(`讀取${table}失敗:`, error);
				continue;
			}
			
			allProducts[table] = data;
		}
		
		res.json({
			success: true,
			allProducts,
			count: Object.values(allProducts).reduce((sum, arr) => sum + arr.length, 0)
		});
		
	} catch(error) {
		console.log('取得商品失敗', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// ===== 取得特定類別商品 =====
app.get('/api/products/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { data, error } = await supabase
            .from(category)
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            category: category,
             data,
            count: data.length
        });

    } catch (error) {
        console.error('取得商品失敗:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 取得新商品 (jarr = true) =====
app.get('/api/products/new', async (req, res) => {
    try {
        const tables = ['mirror', 'magnet', 'coaster', 'wood', 'painting'];
        const newProducts = [];
        const errors = [];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('jarr', true)
                .order('id', { ascending: true });

            if (error) {
                console.error(`讀取 ${table} 失敗:`, error.message);
                errors.push({
                    table: table,
                    error: error.message
                });
                continue;
            }

            if (data && data.length > 0) {
                newProducts.push(...data.map(p => ({ ...p, category: table })));
            }
        }

        res.json({
            success: true,
            newProducts,
            count: newProducts.length,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('取得新商品失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 取得熱門商品 (hot = true) =====
app.get('/api/products/hot', async (req, res) => {
    try {
        const tables = ['mirror', 'magnet', 'coaster', 'wood', 'painting'];
        const hotProducts = [];
        const errors = [];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('hot', true)
                .order('id', { ascending: true });

            if (error) {
                console.error(`讀取 ${table} 失敗:`, error.message);
                errors.push({
                    table: table,
                    error: error.message
                });
                continue;
            }

            if (data && data.length > 0) {
                hotProducts.push(...data.map(p => ({ ...p, category: table })));
            }
        }

        res.json({
            success: true,
            hotProducts,
            count: hotProducts.length,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('取得熱門商品失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 搜尋商品 =====
app.get('/api/products/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        
        if (!keyword) {
            return res.status(400).json({
                success: false,
                error: '請提供搜尋關鍵字'
            });
        }

        const tables = ['mirror', 'magnet', 'coaster', 'wood', 'painting'];
        const results = [];

        for (const table of tables) {
            const { data } = await supabase
                .from(table)
                .select('*');

            if (data) {
                const matched = data.filter(p => 
                    p.feature.toLowerCase().includes(keyword.toLowerCase())
                );
                
                results.push(...matched.map(p => ({ ...p, category: table })));
            }
        }

        res.json({
            success: true,
            keyword: keyword,
             results,
            count: results.length
        });

    } catch (error) {
        console.error('搜尋商品失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 建立訂單 =====
app.post('/api/orders', async (req, res) => {
    try {
        const { 
            buyer_name, 
            buyer_email, 
            buyer_phone,
            recipient_name,
            recipient_email,
            recipient_phone,
            recipient_address,
            cart_items,
            notes
        } = req.body;

        // 驗證必要欄位
        if (!buyer_name || !buyer_email || !cart_items || cart_items.length === 0) {
            return res.status(400).json({
                success: false,
                error: '缺少必要欄位'
            });
        }

        // 計算總金額
        const totalAmount = cart_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = 100; // 運費
        const discountAmount = 0; // 折扣

        // 產生訂單編號
        const orderNumber = `ORD${Date.now()}`;

        // 建立訂單資料
        const orderData = {
            order_number: orderNumber,
            order_date: new Date().toISOString(),
            buyer_name,
            buyer_email,
            buyer_phone,
            recipient_name,
            recipient_email,
            recipient_phone,
            recipient_address,
            order_status: 'pending',
            payment_method: 'Line Pay',
            payment_status: 'unpaid',
            total_amount: totalAmount,
            shipping_fee: shippingFee,
            discount_amount: discountAmount,
            notes: notes || ''
        };

        // 插入訂單
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            throw orderError;
        }

        // 建立訂單項目
        const orderItems = cart_items.map(item => ({
            order_id: order.id,
            product_id: item.datacode,
            product_name: `${item.feature}樣式${item.category_cn}`,
            unit_price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            throw itemsError;
        }

        // 發送 LINE 訊息通知
        const lineMessage = `
			訂單建立成功！

			訂單編號: ${orderNumber}
			客戶姓名: ${buyer_name}
			聯絡電話: ${buyer_phone}
			訂單金額: $${totalAmount}

			商品明細:
			${cart_items.map(item => `• ${item.feature}樣式${item.category_cn} x ${item.quantity} = $${item.price * item.quantity}`).join('\n')}

			總計: $${totalAmount + shippingFee - discountAmount}
        `.trim();

        await sendLineMessage(LINE_USER_ID, lineMessage);

        res.json({
            success: true,
            message: '訂單建立成功',
            order: {
                id: order.id,
                order_number: orderNumber,
                total_amount: totalAmount
            },
            line_notification: '✓ 已發送 LINE 通知'
        });

    } catch (error) {
        console.error('建立訂單失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 取得訂單資訊 =====
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 取得訂單
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (orderError) {
            throw orderError;
        }

        // 取得訂單項目
        const {  data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        if (itemsError) {
            throw itemsError;
        }

        res.json({
            success: true,
            order: order,
            items: items
        });

    } catch (error) {
        console.error('取得訂單失敗:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 取得所有訂單 =====
app.get('/api/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('取得訂單列表失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 發送 LINE 訊息函數 =====
async function sendLineMessage(userId, message) {
    try {
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

        const response = await axios.post(
            'https://api.line.me/v2/bot/message/push',
            body,
            { headers }
        );

        console.log('✅ LINE 訊息發送成功');
        return response.data;

    } catch (error) {
        console.error('❌ LINE 訊息發送失敗:', error.message);
        throw error;
    }
}

// ===== 測試 LINE 訊息 =====
app.post('/api/line/test', async (req, res) => {
    try {
        const { userId, message } = req.body;
        const targetUserId = userId || LINE_USER_ID;
        const testMessage = message || '這是一則測試訊息 🚀';

        await sendLineMessage(targetUserId, testMessage);

        res.json({
            success: true,
            message: 'LINE 訊息已發送',
            to: targetUserId
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== 更新商品庫存 =====
app.put('/api/products/:category/:id/stock', async (req, res) => {
    try {
        const { category, id } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                success: false,
                error: '請提供 quantity 欄位'
            });
        }

        const { data, error } = await supabase
            .from(category)
            .update({ quantity: quantity })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: '庫存更新成功',
             data
        });

    } catch (error) {
        console.error('更新庫存失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = app;
