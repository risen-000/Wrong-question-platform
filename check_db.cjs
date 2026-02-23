
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从 .env.local 读取变量的简单方法
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- 数据库内容诊断 ---');
    const { data, error } = await supabase
        .from('questions')
        .select('id, content, image')
        .not('image', 'is', null)
        .limit(3);

    if (error) {
        console.error('获取失败:', error);
        return;
    }

    console.log(`发现 ${data.length} 个带图片的题目`);
    data.forEach((row, i) => {
        console.log(`\n[题目建议 #${i + 1}] ID: ${row.id}`);
        console.log(`内容: ${row.content.substring(0, 30)}...`);
        if (row.image) {
            console.log(`图片数据类型: ${typeof row.image}`);
            console.log(`图片长度: ${row.image.length}`);
            console.log(`头部预览: ${row.image.substring(0, 50)}...`);
            console.log(`尾部预览: ...${row.image.substring(row.image.length - 30)}`);

            const isBase64Header = row.image.startsWith('data:image/');
            console.log(`是否有正确 base64 头部: ${isBase64Header ? '是' : '否'}`);
        }
    });
}

checkData();
