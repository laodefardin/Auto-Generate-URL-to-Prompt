import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyAWyZOa2932_srtv6rmITPB3gJMuJj3rLY';

let form = document.querySelector('form');
let promptInput = document.querySelector('textarea[name="prompt"]'); // Ganti input ke textarea
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Ambil nilai input dan pisahkan berdasarkan baris atau spasi
    let inputText = promptInput.value.trim();
    let links = inputText.split(/\r?\n|\s+/);  // Pisahkan berdasarkan spasi atau baris baru

    // Filter untuk memastikan hanya link yang valid
    links = links.filter(link => link.startsWith('http://') || link.startsWith('https://'));

    // Jika tidak ada link yang valid
    if (links.length === 0) {
      output.innerHTML = "No valid links provided.";
      return;
    }

    // Untuk setiap link, buat prompt dan kirim ke AI
    let contents = links.map(link => ({
      role: 'user',
      parts: [{ text: `Change the following link to an AI prompt: ${link}` }]
    }));


    // Call the multimodal model, and get a stream of results
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro", // or gemini-1.5-pro
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
 
    // Kita akan menyimpan hasil untuk setiap link dalam array
    // Kita akan menyimpan hasil untuk setiap link dalam array
    let allResults = [];

    for (let content of contents) {
      const result = await model.generateContentStream({ contents: [content] });

      let buffer = [];
      let md = new MarkdownIt();
      for await (let response of result.stream) {
        buffer.push(response.text());
      }

      // Gabungkan hasil dalam array
      allResults.push(md.render(buffer.join('')));
    }

    // Menghapus teks 'AI Prompt: ' dari hasil jika ada
    allResults = allResults.map(result => result.replace(/AI Prompt: /g, ''));

    // Tampilkan semua hasil
    output.innerHTML = allResults.join('<hr>'); // Menampilkan setiap hasil terpisah dengan <hr>

  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

// Tombol "Reset Form"
let resetButton = document.getElementById('reset-button');
resetButton.addEventListener('click', () => {
  form.reset();  // Mengatur ulang form ke kondisi awal
  output.textContent = '';  // Menghapus output
  promptInput.focus();  // Mengembalikan fokus ke input
});

// Tombol untuk menyalin konten output
const copyButton = document.getElementById('copy-button');

copyButton.addEventListener('click', () => {
  const outputText = output.innerText;  // Ambil teks dari elemen output

  // Buat elemen textarea sementara untuk menyalin teks
  const textarea = document.createElement('textarea');
  textarea.value = outputText;
  document.body.appendChild(textarea);

  // Pilih dan salin konten
  textarea.select();
  document.execCommand('copy');

  // Hapus textarea sementara setelah disalin
  document.body.removeChild(textarea);

  // Menampilkan pemberitahuan jika teks telah disalin
  alert('Output has been copied to clipboard!');
});

// You can delete this once you've filled out an API key
maybeShowApiKeyBanner(API_KEY);
