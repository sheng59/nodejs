require('dotenv').config();

const express = require('express');
const cors = require('cors')
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ===== 設定 =====
const SUPABASE_URL = process.env.SUPABASE_URL || "https://yvemaakibhtbtohrenjc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZW1hYWtpYmh0YnRvaHJlbmpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg1ODY2MywiZXhwIjoyMDcxNDM0NjYzfQ.q_HbjUVdXvM4U9LGuyUmk_NjiKFegG3Re5ydTTYdQi8";
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN || "N03jvw1MeewY85pihAGpGZXPaHCHFfRmxY07hDB++uF9sg4Eh9jrkVZZcjzDpbUl5pFu5gtltDeIStWx51Yq/y7yJvV9MIjzPSVXgH8my95amCvbxNTGBG6jqEQS5t1QtNcSunhidGM+hFNOmQ6bAAdB04t89/1O/w1cDnyilFU=";
const LINE_USER_ID = process.env.LINE_USER_ID || "U9f44bf9ba0f448f57ca9d6431d8453d5";

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
			'GET /api/auth/check': '檢查登入狀態',
			'POST /api/auth/login': '處理登入',
			'POST /api/auth/logout': '處理登出',
			'GET /api/auth/signup': '註冊新用戶',
			'GET /api/env': '檢查環境變數',
			'GET /api/products': '取得所有商品',
			'GET /api/products/new': '取得新商品',
			'GET /api/products/hot': '取得熱門商品',
			'GET /api/products/search': '搜尋商品',
			'GET /api/products/:category': '取得特定類別商品',
			'POST /api/orders': '建立訂單',
			'GET /api/orders/:id': '取得訂單資訊',
			'GET /api/orders': '取得所有訂單',
			'POST /api/line/test': '測試LINE訊息',
			'POST /api/sync': '資料庫同步',
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

// 檢查登入狀態
app.get('/api/auth/check', async (req, res) => {
    try {
        const { authorization } = req.headers;
        
        if (!authorization) {
            return res.json({ 
                logged_in: false,
                message: '未提供認證資訊'
            });
        }
        
        const token = authorization.replace('Bearer ', '');
		console.log('🔑 收到的 Token:', token.substring(0, 20) + '...'); // 只打印前20字符
		
        const { data, error } = await supabase.auth.getUser(token);
	
		console.log('📊 Supabase 返回:', { data, error });
		
        if (error) {
            console.log('❌ Supabase 錯誤:', error);
            return res.status(401).json({ 
                logged_in: false,
                message: error.message || '認證無效'
            });
        }
		
		if (!data || !data.user) {
            console.log('❌ 無效的用戶數據:', data);
            return res.status(401).json({ 
                logged_in: false,
                message: '無效的 token'
            });
        }
		
		const user = data.user;
        console.log('✅ 用戶認證成功:', user.email);
        
        res.json({
            logged_in: true,
            data: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('檢查登入狀態失敗:', error);
        res.status(500).json({ 
            logged_in: false,
            error: error.message 
        });
    }
});

// 處理登入
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: '請提供電子郵件和密碼' 
            });
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            return res.status(401).json({ 
                success: false, 
                error: error.message 
            });
        }
        
        res.json({
            success: true,
            message: '登入成功',
            user: {
                id: data.user.id,
                email: data.user.email
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            }
        });
        
    } catch (error) {
        console.error('登入失敗:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 處理登出
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { authorization } = req.headers;
        
        if (!authorization) {
            return res.status(400).json({ 
                success: false, 
                error: '未提供認證資訊' 
            });
        }
        
        const token = authorization.replace('Bearer ', '');
        const { error } = await supabase.auth.signOut(token);
        
        if (error) {
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
        
        res.json({ 
            success: true, 
            message: '登出成功' 
        });
        
    } catch (error) {
        console.error('登出失敗:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== 後台同步路由 =====
app.post('/api/sync', async (req, res) => {
    try {
        const { tables } = req.body;
        
        if (!tables || !Array.isArray(tables)) {
            return res.status(400).json({ 
                success: false, 
                error: '缺少 tables 資料' 
            });
        }
        
        const results = [];
        
        for (const tableData of tables) {
            const { tableName, folder, rows } = tableData;
            
            if (!tableName || !folder || !rows) {
                results.push({
                    table: tableName || 'unknown',
                    success: false,
                    error: '缺少必要欄位'
                });
                continue;
            }
            
            try {
                // 1. 刪除多餘資料
                const { data: serverRows } = await supabase
                    .from(tableName)
                    .select('id');
                
                if (serverRows) {
                    const serverIds = serverRows.map(r => r.id);
                    const localIds = rows.map(r => r.id);
                    const deleteIds = serverIds.filter(id => !localIds.includes(id));
                    
                    if (deleteIds.length > 0) {
                        await supabase
                            .from(tableName)
                            .delete()
                            .in('id', deleteIds);
                    }
                }
                
                // 2. Upsert 資料
                const upsertData = rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    feature: row.feature,
                    price: row.price,
                    quantity: row.quantity,
                    jarr: row.jarr,
                    hot: row.hot
                }));
                
                await supabase
                    .from(tableName)
                    .upsert(upsertData, { onConflict: ['id'] });
                
                results.push({
                    table: tableName,
                    success: true,
                    message: `已同步 ${rows.length} 筆資料`
                });
                
            } catch (error) {
                console.error(`同步 ${tableName} 失敗:`, error);
                results.push({
                    table: tableName,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // 檢查是否有失敗的同步
        const hasError = results.some(r => !r.success);
        
        res.json({
            success: !hasError,
            message: hasError ? '部分同步失敗' : '同步成功',
            results: results
        });
        
    } catch (error) {
        console.error('同步失敗:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
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

// ===== 取得新商品 (jarr = true) =====
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

// ===== 取得熱門商品 (hot = true) =====
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

// ===== 建立訂單 =====
app.post('/api/orders', async (req, res) => {
    try {
        const { orderData, orderItems, orderMessage } = req.body;
        
        // 驗證
        if (!orderData || !orderItems || !Array.isArray(orderItems)) {
            return res.status(400).json({ error: '格式錯誤' });
        }

        // 插入訂單
        const {  data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            console.error('❌ 訂單插入失敗:', orderError);
            return res.status(400).json({ 
                error: '訂單插入失敗',
                details: orderError.message
            });
        }
		
        // 處理商品
        const itemsToInsert = orderItems.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('❌ 訂單項目插入失敗:', itemsError);
            return res.status(400).json({ 
                error: '訂單項目插入失敗',
                details: itemsError.message
            });
        }
		
		let lineStatus = '未發送';
		
		if (orderMessage && CHANNEL_ACCESS_TOKEN) {
			try {
				await sendLineMessage(LINE_USER_ID, orderMessage);
				lineStatus = '✓ 已發送';
			} catch (lineError) {
				console.error('⚠️ LINE 訊息發送失敗:', lineError.message);
				lineStatus = `✗ 失敗: ${lineError.message}`;
			}
		}

        res.json({ 
            success: true, 
            order_id: order.id, 
            items_count: itemsToInsert.length,
			line_notification: lineStatus,
            message: '訂單建立成功'
        });

    } catch (error) {
        console.error('❌', error.message);
        res.status(500).json({ error: error.message });
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


/*app.listen(PORT, () => {
  console.log(`Server running on port:${3000}/`)
})*/

module.exports = app;
