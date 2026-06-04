require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Groq } = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq client without crashing immediately if key is missing
let groq;
try {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_crash'
    });
} catch (e) {
    console.warn("Groq API Key bulunamadı!");
}

app.use(cors());
app.use(express.json());

// Frontend (Public) klasörünü sunucuya tanıtıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// Railway Healthcheck (Sunucu ayakta mı kontrolü)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Root endpoint: doğrudan dashboard'a yönlendir
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- YAPAY ZEKA API UÇ NOKTASI ---
app.post('/api/ai-program', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Konu (topic) gerekli.' });
        }

        // Küfür ve Hakaret Filtresi (Basit Dizi)
        const forbiddenWords = ['amk', 'aq', 'siktir', 'oç', 'piç', 'yarrak', 'amına', 'göt', 'pezevenk', 'kahpe', 'aptal', 'salak', 'mal', 'gerizekalı', 'sg', 'orospu', 'yavşak', 'gavat'];
        const lowerTopic = topic.toLowerCase();
        
        // Eğer kelimelerden biri geçiyorsa doğrudan API'ye gitmeden cevap dön
        const containsProfanity = forbiddenWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(lowerTopic) || lowerTopic.includes(word);
        });

        if (containsProfanity) {
            return res.json({ 
                success: true, 
                html: '<div class="text-error font-medium flex items-center gap-2"><span class="material-symbols-outlined">warning</span> Lütfen hakaret ve argo barındıran ifadeler kullanmaktan kaçının. Size kariyeriniz için nasıl profesyonel bir şekilde yardımcı olabilirim?</div>' 
            });
        }

        console.log(`[Groq] Gelen İstek: ${topic}`);

        // Groq API'ye gönderilecek sistem promptu
        const prompt = `
Sen "Nova AI" adında profesyonel bir kariyer ve mentörlük asistanısın. 
Eğer kullanıcının girdiği "${topic}" konusu herhangi bir argo, küfür veya cinsel içerik barındırıyorsa SADECE şu cümleyi döndür: "<div class='text-error font-medium flex items-center gap-2'><span class='material-symbols-outlined'>warning</span> Lütfen hakaret ve argo barındıran ifadeler kullanmaktan kaçının. Size nasıl profesyonel bir şekilde yardımcı olabilirim?</div>". Başka hiçbir şey ekleme.

Eğer zararlı bir içerik yoksa:
Kullanıcı "${topic}" alanında kendini geliştirmek için bir program oluşturmak istiyor. 
Lütfen bu konuyla ilgili çok şık ve mantıklı 4 veya 5 maddelik bir eğitim başlıkları listesi (müfredat) çıkar. 
Dönüş formatı sadece Türkçe olmalı, kısa ve öz olmalı. HTML <ul class="list-disc pl-5 space-y-2 text-sm opacity-90"> ve <li> etiketleri kullanarak formatlanmış bir şekilde geri döndür. 
Sadece listeyi ver, HTML harici bir metin veya giriş/çıkış cümlesi kurma.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', // Güncel Llama 3.1 modeli
            temperature: 0.5,
            max_tokens: 1024,
        });

        const generatedHtml = chatCompletion.choices[0]?.message?.content || 'Üzgünüm, program oluşturulamadı.';
        res.json({ success: true, html: generatedHtml });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: 'Yapay zeka hatası: ' + error.message });
    }
});

// Fallback: Bulunamayan rotaları dashboard'a yönlendir
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Sunucuyu Başlat (0.0.0.0 host binding eklendi - Railway için kritik)
if (process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 NovaMentor Backend çalışıyor! Port: ${PORT}`);
    });
}

// Vercel Serverless desteği için uygulamayı dışa aktar
module.exports = app;
