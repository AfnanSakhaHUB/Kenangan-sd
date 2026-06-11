// ==========================================================================
// CONFIG & INITIALIZATION FIREBASE (FIRESTORE REALTIME)
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SIlakan isi dengan konfigurasi kredensial Firebase Console Anda
const firebaseConfig = {
    apiKey: "NILAI_API_KEY_ANDA",
    authDomain: "PROJECT_ANDA.firebaseapp.com",
    projectId: "PROJECT_ANDA",
    storageBucket: "PROJECT_ANDA.appspot.com",
    messagingSenderId: "SENDER_ID_ANDA",
    appId: "APP_ID_ANDA"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messagesRef = collection(db, "messages");

// ==========================================================================
// DOM SELECTORS & STATE MANAGEMENT
// ==========================================================================
const startNode = document.getElementById('start-node');
const menuNode = document.getElementById('menu-node');
const btnMinigames = document.getElementById('btn-minigames');
const btnKenangan = document.getElementById('btn-kenangan');
const btnKritik = document.getElementById('btn-kritik');
const mainViewport = document.getElementById('main-viewport');
const windSfx = document.getElementById('windSfx');
const skyScene = document.getElementById('sky-scene');

// Kritik Scene DOM
const kritikScene = document.getElementById('kritik-scene');
const btnBackMain = document.getElementById('btn-back-main');
const formKritik = document.getElementById('form-kritik');
const inputNama = document.getElementById('input-nama');
const inputKata = document.getElementById('input-kata');
const charCount = document.getElementById('char-count');
const bubblesContainer = document.getElementById('bubbles-container');
const bubblesViewport = document.getElementById('bubbles-viewport');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');

let audioTracker;
let allMessages = [];
let currentPage = 1;
const itemsPerPage = 10;
let isAdmin = false;

// ==========================================================================
// CORE DOM INTERACTIONS (LOGIKA ASLI YANG DIPERTAHANKAN)
// ==========================================================================
startNode.addEventListener('click', () => {
    windSfx.pause(); windSfx.currentTime = 0;
    windSfx.play().then(() => {
        clearInterval(audioTracker);
        audioTracker = setInterval(() => {
            if (windSfx.currentTime >= 3.0) {
                windSfx.pause(); windSfx.currentTime = 0;
                clearInterval(audioTracker);
            }
        }, 100);
    }).catch(error => console.log("Audio terblokir:", error));

    startNode.classList.add('meledak');

    setTimeout(() => {
        startNode.classList.add('hidden');
        menuNode.classList.remove('hidden');
        menuNode.classList.add('reveal');
        
        setTimeout(() => {
            const allBalloons = menuNode.querySelectorAll('.balloon-group');
            allBalloons.forEach((b, idx) => {
                b.style.animation = `ayunBalon 3s ease-in-out infinite alternate`;
                b.style.animationDelay = `-${idx}s`;
            });
        }, 1200);
    }, 300); 
});

btnMinigames.addEventListener('click', () => {
    btnMinigames.classList.add('meledak');
    setTimeout(() => { mainViewport.classList.add('camera-down'); }, 300);
});

btnKenangan.addEventListener('click', () => {
    btnKenangan.classList.add('meledak');
    setTimeout(() => { mainViewport.classList.add('space-launch'); }, 300);
    setTimeout(() => { window.location.href = 'start.html'; }, 2300);
});

// ==========================================================================
// FITUR 1 & 2: MEKANISME LEDAKAN MASSAL & PERCEPATAN LINGKUNGAN
// ==========================================================================
btnKritik.addEventListener('click', () => {
    // 1. Ledakkan seluruh balon di layar secara bersamaan
    const allBalloons = menuNode.querySelectorAll('.balloon-group');
    allBalloons.forEach(b => {
        b.classList.add('meledak');
        createExplosionParticles(b);
    });

    // 2. Percepat gerak awan dan burung
    triggerFastTransition();

    // 3. Masuk ke halaman Kritik & Saran setelah efek ledakan selesai
    setTimeout(() => {
        document.querySelector('.container').classList.add('hidden');
        kritikScene.classList.remove('hidden');
        setTimeout(() => kritikScene.classList.add('active'), 50);
    }, 1000);
});

// Fungsi mempercepat awan dan burung selama 3 detik
function triggerFastTransition() {
    skyScene.classList.add('fast-speed');
    setTimeout(() => {
        skyScene.classList.remove('fast-speed');
    }, 3000);
}

// Fungsi generator partikel peledak balon
function createExplosionParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ['#ffffff', '#ffdd1a', '#e63946', '#3a8ffd', '#7db941'];

    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'balloon-particle';
        document.body.appendChild(particle);

        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        const destX = (Math.random() - 0.5) * 350;
        const destY = (Math.random() - 0.5) * 350;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${destX}px, ${destY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800 + Math.random() * 400,
            easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
            fill: 'forwards'
        });

        setTimeout(() => particle.remove(), 1200);
    }
}

// ==========================================================================
// FITUR 3 & 8: VALIDASI FORM & MODE ADMIN RAHASIA ",gwAdmin"
// ==========================================================================
inputKata.addEventListener('input', () => {
    charCount.textContent = inputKata.value.length;
});

// Trigger Mode Admin Realtime via ketikan langsung di kolom nama
inputNama.addEventListener('input', () => {
    if (inputNama.value === ",gwAdmin") {
        isAdmin = true;
        document.body.classList.add('admin-active');
        alert("🛡️ MODE ADMIN AKTIF! Anda dapat menghapus bubble langsung.");
        renderBubbles();
    }
});

formKritik.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const namaValue = inputNama.value.trim();
    const kataValue = inputKata.value.trim();

    // Validasi maksimal 5 kata untuk nama
    const wordCount = namaValue.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 5) {
        alert("Gagal: Nama tidak boleh lebih dari 5 kata!");
        return;
    }

    // Validasi maksimal 500 karakter untuk kata-kata
    if (kataValue.length > 500) {
        alert("Gagal: Kata-kata melebihi batasan 500 karakter!");
        return;
    }

    try {
        // Animasi feedback ditiup dari form sebelum push data beres
        createBlowUpFeedbackBubble(namaValue, kataValue);

        await addDoc(messagesRef, {
            name: namaValue,
            text: kataValue,
            timestamp: serverTimestamp()
        });

        formKritik.reset();
        charCount.textContent = "0";
    } catch (err) {
        console.error("Gagal menyimpan data:", err);
    }
});

// Efek bubble tiruan ditiup ke atas sesaat setelah submit tombol klik
function createBlowUpFeedbackBubble(name, text) {
    const feedback = document.createElement('div');
    feedback.className = 'bubble-item';
    feedback.style.width = '130px';
    feedback.style.height = '130px';
    feedback.innerHTML = `<strong>${name}</strong><p>${text.substring(0,25)}...</p>`;
    
    const rectForm = formKritik.getBoundingClientRect();
    feedback.style.left = `${rectForm.left + rectForm.width / 2}px`;
    feedback.style.top = `${rectForm.top}px`;
    feedback.style.position = 'fixed';
    feedback.style.zIndex = '99';
    feedback.style.animation = 'none';
    
    document.body.appendChild(feedback);
    
    feedback.animate([
        { transform: 'translate(-50%, 0) scale(0.5)', opacity: 1 },
        { transform: 'translate(-50%, -100vh) scale(1.2)', opacity: 0 }
    ], {
        duration: 1500,
        easing: 'ease-in'
    });
    
    setTimeout(() => feedback.remove(), 1500);
}

// ==========================================================================
// FITUR 4, 5 & 6: SINKRONISASI FIRESTORE & PAGINASI BUBBLE REALTIME
// ==========================================================================
const q = query(messagesRef, orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    allMessages = [];
    snapshot.forEach((doc) => {
        allMessages.push({ id: doc.id, ...doc.data() });
    });
    renderBubbles();
});

function renderBubbles() {
    bubblesContainer.innerHTML = '';
    
    const totalItems = allMessages.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Pemotongan array berbasis index halaman saat ini
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pageData = allMessages.slice(startIdx, startIdx + itemsPerPage);

    pageData.forEach((item) => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble-item';
        
        // Atur rasio ukuran bubble agar seimbang dengan total text panjang pendeknya
        const baseSize = Math.min(170, Math.max(115, 110 + (item.text ? item.text.length * 0.4 : 0)));
        bubble.style.width = `${baseSize}px`;
        bubble.style.height = `${baseSize}px`;

        // Sebar letak koordinat horizontal awal secara acak aman (10% - 85%)
        bubble.style.left = `${Math.random() * 75 + 10}%`;
        
        // Berikan variabel kustom CSS agar arah terbang melenceng miring berbeda-beda
        bubble.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 140}px`);
        
        // Pengaturan durasi & delay negatif agar bubble tersebar acak di layar saat load
        bubble.style.animationDuration = `${12 + Math.random() * 10}s`;
        bubble.style.animationDelay = `${Math.random() * -15}s`;

        bubble.innerHTML = `<strong>${item.name}</strong><p>${item.text || ''}</p>`;

        // Modifikasi khusus untuk mode Admin Rahasia
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-bubble-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = "Hapus Bubble Realtime";
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Apakah Anda yakin ingin menghapus bubble dari "${item.name}"?`)) {
                    try {
                        await deleteDoc(doc(db, "messages", item.id));
                    } catch (err) {
                        alert("Gagal menghapus data: " + err);
                    }
                }
            });
            bubble.appendChild(deleteBtn);
        }

        bubblesContainer.appendChild(bubble);
    });

    // Kontrol Tombol Pagination
    if (currentPage > 1) btnPrevPage.classList.remove('hidden');
    else btnPrevPage.classList.add('hidden');

    if (totalPages > currentPage) btnNextPage.classList.remove('hidden');
    else btnNextPage.classList.add('hidden');
}

// Logika Navigasi Halaman dengan Efek Transisi Dipercepat
btnNextPage.addEventListener('click', () => {
    triggerFastTransition();
    setTimeout(() => {
        currentPage++;
        renderBubbles();
    }, 400);
});

btnPrevPage.addEventListener('click', () => {
    triggerFastTransition();
    setTimeout(() => {
        currentPage--;
        renderBubbles();
    }, 400);
});

// ==========================================================================
// FITUR 7: EFEK KAMERA PARALLAX RINGAN PADA BUBBLE CONTAINER
// ==========================================================================
bubblesViewport.addEventListener('mousemove', (e) => {
    const rect = bubblesViewport.getBoundingClientRect();
    const moveX = (rect.width / 2 - (e.clientX - rect.left)) / 25;
    const moveY = (rect.height / 2 - (e.clientY - rect.top)) / 25;
    bubblesContainer.style.transform = `translate(${moveX}px, ${moveY}px) `;
});

bubblesViewport.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = bubblesViewport.getBoundingClientRect();
        const moveX = (rect.width / 2 - (touch.clientX - rect.left)) / 25;
        const moveY = (rect.height / 2 - (touch.clientY - rect.top)) / 25;
        bubblesContainer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
});

// Reset posisi kamera saat kursor meninggalkan area display bubble
bubblesViewport.addEventListener('mouseleave', () => {
    bubblesContainer.style.transform = 'translate(0px, 0px)';
});


// ==========================================================================
// FITUR 9: TOMBOL KEMBALI KEE LAYAR UTAMA (MAINTAIN REALTIME STATE)
// ==========================================================================
btnBackMain.addEventListener('click', () => {
    kritikScene.classList.remove('active');
    setTimeout(() => {
        kritikScene.classList.add('hidden');
        document.querySelector('.container').classList.remove('hidden');
        menuNode.classList.remove('hidden');

        // Kembalikan visual balon utama agar siap dioperasikan lagi tanpa refresh halaman
        const allBalloons = menuNode.querySelectorAll('.balloon-group');
        allBalloons.forEach((b, idx) => {
            b.classList.remove('meledak');
            b.style.animation = `ayunBalon 3s ease-in-out infinite alternate`;
            b.style.animationDelay = `-${idx}s`;
        });
    }, 500);
});
