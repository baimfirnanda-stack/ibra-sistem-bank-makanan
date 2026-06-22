/**
 * app.js
 * Logika utama untuk Sistem Bank Makanan (Food Rescue) Kota Lumajang.
 * Mengelola state, visualisasi peta radar, visualisasi Chart.js, serta
 * seluruh interaksi form dan perpindahan halaman/dashboard.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. STATE MANAGEMENT & INITIALIZATION
    // ==========================================================================
    let users = [];
    let donations = [];
    let requests = [];
    let currentUser = null;
    
    // Inisialisasi data ke localStorage jika belum ada
    function initLocalStorage() {
        if (!localStorage.getItem("users")) {
            localStorage.setItem("users", JSON.stringify(window.INITIAL_USERS || []));
        }
        if (!localStorage.getItem("donations")) {
            localStorage.setItem("donations", JSON.stringify(window.INITIAL_DONATIONS || []));
        }
        if (!localStorage.getItem("requests")) {
            localStorage.setItem("requests", JSON.stringify(window.INITIAL_REQUESTS || []));
        }
    }
    
    function loadState() {
        initLocalStorage();
        users = JSON.parse(localStorage.getItem("users"));
        donations = JSON.parse(localStorage.getItem("donations"));
        requests = JSON.parse(localStorage.getItem("requests"));
        currentUser = JSON.parse(localStorage.getItem("currentUser"));
        
        // Bersihkan donasi yang kadaluarsa secara otomatis
        checkExpiredDonations();
    }
    
    function saveState() {
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("donations", JSON.stringify(donations));
        localStorage.setItem("requests", JSON.stringify(requests));
        if (currentUser) {
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        } else {
            localStorage.removeItem("currentUser");
        }
    }
    
    // Mengecek kelayakan waktu makanan
    function checkExpiredDonations() {
        let changed = false;
        const now = new Date();
        donations.forEach(don => {
            if (don.status === "Tersedia" && new Date(don.expiryAt) < now) {
                don.status = "Kadaluarsa";
                don.updatedAt = now.toISOString();
                changed = true;
            }
        });
        if (changed) {
            saveState();
        }
    }
    
    // ==========================================================================
    // 2. TOAST NOTIFICATION HUB
    // ==========================================================================
    function showToast(message, type = "success") {
        const hub = document.getElementById("toast-hub");
        if (!hub) return;
        
        const toast = document.createElement("div");
        toast.className = `toast ${type === "error" ? "toast-error" : type === "warning" ? "toast-warning" : type === "info" ? "toast-info" : ""}`;
        
        let icon = "✔️";
        if (type === "error") icon = "❌";
        if (type === "warning") icon = "⚠️";
        if (type === "info") icon = "ℹ️";
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        `;
        
        hub.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = "fadeOut 0.3s forwards";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    // ==========================================================================
    // 3. SEEDING & PAGE LOAD TRIGGERS
    // ==========================================================================
    loadState();
    
    // Cek query parameters dari halaman registrasi / login admin
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("registered") === "true") {
        const registeredName = urlParams.get("name") || "Institusi Baru";
        showToast(`Pendaftaran Berhasil! Akun "${registeredName}" sedang menunggu verifikasi Administrator.`, "info");
        // Hapus query params agar tidak berulang saat refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get("login_success") === "true") {
        showToast("Login Administrator Berhasil!", "success");
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get("open_login") === "true") {
        openAuthModal("login");
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // ==========================================================================
    // 4. AUTHENTICATION & SESSION HANDLING
    // ==========================================================================
    const modalAuth = document.getElementById("modal-auth");
    const authLoginView = document.getElementById("auth-view-login");
    const authRegisterView = document.getElementById("auth-view-register");
    const btnLoginLogout = document.getElementById("btn-login-logout");
    const userProfileWidget = document.getElementById("user-profile-widget");
    const userNameDisplay = document.getElementById("user-name-display");
    const userBadgeDisplay = document.getElementById("user-badge-display");
    
    function openAuthModal(tab = "login") {
        modalAuth.classList.add("active");
        if (tab === "register") {
            // Arahkan langsung ke halaman terpisah register.html sesuai kebutuhan user
            window.location.href = "register.html";
        } else {
            authLoginView.style.display = "block";
            authRegisterView.style.display = "none";
        }
    }
    
    function closeAuthModal() {
        modalAuth.classList.remove("active");
    }
    
    // Handler Modal Close Buttons
    document.getElementById("btn-close-auth-modal").addEventListener("click", closeAuthModal);
    
    // Switch login <-> register link triggers
    document.getElementById("link-switch-to-register").addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal("register");
    });
    
    document.getElementById("link-switch-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal("login");
    });
    
    // Tombol Registrasi di Hero Landing Page
    document.getElementById("btn-register-trigger").addEventListener("click", () => {
        window.location.href = "register.html";
    });
    
    // Tombol Masuk/Keluar di Navbar
    btnLoginLogout.addEventListener("click", () => {
        if (currentUser) {
            // Logout
            currentUser = null;
            saveState();
            showToast("Anda telah keluar dari akun.", "info");
            renderApp();
        } else {
            openAuthModal("login");
        }
    });
    
    // Form Login Manual
    document.getElementById("form-login-manual").addEventListener("submit", (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById("login-username").value.trim().toLowerCase();
        const passwordInput = document.getElementById("login-password").value;
        
        const user = users.find(u => u.username === usernameInput);
        
        if (!user) {
            showToast("Username tidak terdaftar.", "error");
            return;
        }
        
        if (user.password !== passwordInput) {
            showToast("Password salah.", "error");
            return;
        }
        
        // Verifikasi akun
        if (!user.verified && user.role !== "admin") {
            showToast("Akun Anda belum disetujui oleh Administrator.", "warning");
            return;
        }
        
        // Sukses Login
        currentUser = user;
        saveState();
        closeAuthModal();
        showToast(`Selamat datang kembali, ${user.name}!`, "success");
        renderApp();
    });
    
    // Login Instan (Dropdown Demo di Landing Page)
    document.querySelectorAll(".select-quick-login").forEach(select => {
        select.addEventListener("change", (e) => {
            const username = e.target.value;
            if (!username) return;
            
            const user = users.find(u => u.username === username);
            if (!user) return;
            
            // Cek verifikasi terlebih dahulu
            if (!user.verified && user.role !== "admin") {
                showToast(`Akun "${user.name}" belum diverifikasi oleh admin. Silakan masuk sebagai admin terlebih dahulu untuk menyetujuinya.`, "warning");
                e.target.value = ""; // Reset dropdown
                return;
            }
            
            currentUser = user;
            saveState();
            showToast(`Login instan berhasil sebagai ${user.name}!`, "success");
            e.target.value = ""; // Reset dropdown
            renderApp();
        });
    });
    
    // Integrasi klik kartu peran
    document.getElementById("card-role-donor").addEventListener("click", (e) => {
        // Jika klik bukan pada select element
        if (e.target.tagName !== "SELECT" && e.target.tagName !== "OPTION") {
            openAuthModal("login");
        }
    });
    document.getElementById("card-role-recipient").addEventListener("click", (e) => {
        if (e.target.tagName !== "SELECT" && e.target.tagName !== "OPTION") {
            openAuthModal("login");
        }
    });
    document.getElementById("card-role-admin").addEventListener("click", (e) => {
        if (e.target.tagName !== "SELECT" && e.target.tagName !== "OPTION") {
            // Arahkan ke halaman login admin khusus
            window.location.href = "admin-login.html";
        }
    });
    
    // Logo klik menuju beranda / dashboard awal
    document.getElementById("btn-home").addEventListener("click", () => {
        if (currentUser) {
            // Aktifkan tab pertama dashboard peran
            const firstTab = document.querySelector(".sidebar-link");
            if (firstTab) firstTab.click();
        } else {
            renderApp();
        }
    });
    
    // ==========================================================================
    // 5. VIEW ROUTING & RENDERING ENGINE
    // ==========================================================================
    function renderApp() {
        const panelLanding = document.getElementById("panel-landing");
        const panelDashboard = document.getElementById("panel-dashboard");
        const sidebarMenuList = document.getElementById("sidebar-menu-list");
        
        // Reset view classes
        document.body.className = "";
        
        if (currentUser) {
            // Pengguna sedang login
            panelLanding.style.display = "none";
            panelDashboard.style.display = "block";
            btnLoginLogout.textContent = "Keluar";
            btnLoginLogout.className = "btn btn-secondary";
            
            // Render user widget
            userProfileWidget.style.display = "flex";
            userNameDisplay.textContent = currentUser.name;
            userBadgeDisplay.className = `user-badge role-${currentUser.role}`;
            
            // Setup dashboard berdasarkan peran
            document.body.classList.add(`role-${currentUser.role}`);
            setupSidebarAndSections();
            
            // Render Peta Interaktif
            renderMap();
        } else {
            // Pengguna tidak login (Beranda)
            panelLanding.style.display = "block";
            panelDashboard.style.display = "none";
            btnLoginLogout.textContent = "Masuk";
            btnLoginLogout.className = "btn btn-secondary";
            userProfileWidget.style.display = "none";
        }
    }
    
    function setupSidebarAndSections() {
        const sidebarMenuList = document.getElementById("sidebar-menu-list");
        sidebarMenuList.innerHTML = "";
        
        // Sembunyikan semua section dashboard terlebih dahulu
        document.querySelectorAll(".dashboard-section").forEach(sec => {
            sec.classList.remove("active");
        });
        
        let menuItems = [];
        
        if (currentUser.role === "donor") {
            menuItems = [
                { id: "sec-donor-overview", label: "Dashboard Overview", icon: "📊" },
                { id: "sec-donor-add", label: "Donasikan Makanan", icon: "🍲" },
                { id: "sec-donor-list", label: "Kelola Stok Donasi", icon: "📋" },
                { id: "sec-donor-requests", label: "Permintaan Pangan", icon: "🏠" }
            ];
        } else if (currentUser.role === "recipient") {
            menuItems = [
                { id: "sec-recipient-catalog", label: "Katalog Makanan", icon: "😋" },
                { id: "sec-recipient-claims", label: "Klaim Saya", icon: "🚚" },
                { id: "sec-recipient-requests", label: "Ajukan Kebutuhan", icon: "📢" }
            ];
        } else if (currentUser.role === "admin") {
            menuItems = [
                { id: "sec-admin-overview", label: "Admin Overview", icon: "⚡" },
                { id: "sec-admin-verify", label: "Verifikasi Akun", icon: "🔑" },
                { id: "sec-admin-logs", label: "Transaksi Global", icon: "🗺️" }
            ];
        }
        
        // Buat menu sidebar secara dinamis
        menuItems.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = `sidebar-link ${index === 0 ? "active" : ""}`;
            li.innerHTML = `
                <span class="sidebar-icon">${item.icon}</span>
                <span>${item.label}</span>
            `;
            
            li.addEventListener("click", () => {
                // Toggle active menu
                document.querySelectorAll(".sidebar-link").forEach(l => l.classList.remove("active"));
                li.classList.add("active");
                
                // Toggle active section
                document.querySelectorAll(".dashboard-section").forEach(sec => {
                    sec.classList.remove("active");
                });
                
                const activeSection = document.getElementById(item.id);
                if (activeSection) {
                    activeSection.classList.add("active");
                    
                    // Inisialisasi ulang grafik jika memuat overview
                    if (item.id === "sec-donor-overview") {
                        renderDonorCharts();
                    } else if (item.id === "sec-admin-overview") {
                        renderAdminCharts();
                    }
                }
            });
            
            sidebarMenuList.appendChild(li);
        });
        
        // Tampilkan section pertama
        if (menuItems.length > 0) {
            const defaultSection = document.getElementById(menuItems[0].id);
            if (defaultSection) {
                defaultSection.classList.add("active");
                
                // Panggil render grafik awal
                if (menuItems[0].id === "sec-donor-overview") {
                    renderDonorCharts();
                } else if (menuItems[0].id === "sec-admin-overview") {
                    renderAdminCharts();
                }
            }
        }
        
        // Sync & Render Data pendukung tab dashboard
        syncDataViews();
    }
    
    function syncDataViews() {
        if (!currentUser) return;
        
        if (currentUser.role === "donor") {
            renderDonorOverviewMetrics();
            renderDonorMyDonationsTable();
            renderDonorRequestsList();
        } else if (currentUser.role === "recipient") {
            renderRecipientCatalog();
            renderRecipientClaimsTable();
            renderRecipientMyRequestsTable();
        } else if (currentUser.role === "admin") {
            renderAdminOverviewMetrics();
            renderAdminVerifyLists();
            renderAdminGlobalLogsTable();
        }
    }
    
    // ==========================================================================
    // 6. INTERACTIVE MAP (LUMAJANG RADAR MAP)
    // ==========================================================================
    function renderMap() {
        const mapNodesContainer = document.getElementById("map-nodes-container");
        if (!mapNodesContainer) return;
        
        mapNodesContainer.innerHTML = "";
        
        // Tampilkan hanya pengguna ber-role donor dan recipient yang terverifikasi dan memiliki koordinat
        const activeUsers = users.filter(u => u.verified && u.latitude && u.longitude);
        
        activeUsers.forEach(u => {
            // Hitung persentase posisi dari koordinat relatif terhadap pusat Lumajang
            // Pusat Lumajang: -8.133, 113.224
            // Skala pengali disesuaikan agar menyebar pas di radar 300px
            let leftPercent = 50 + (u.longitude - 113.224) * 4500;
            let topPercent = 50 - (u.latitude - (-8.133)) * 4500;
            
            // Batasi agar tetap di dalam radar
            leftPercent = Math.max(8, Math.min(92, leftPercent));
            topPercent = Math.max(8, Math.min(92, topPercent));
            
            const node = document.createElement("div");
            node.className = `map-node node-${u.role}`;
            node.style.left = `${leftPercent}%`;
            node.style.top = `${topPercent}%`;
            
            // Hitung donasi/klaim aktif untuk ditampilkan di tooltip
            let statusDetail = "";
            if (u.role === "donor") {
                const activeDonationsCount = donations.filter(d => d.donorId === u.id && d.status === "Tersedia").length;
                statusDetail = `${activeDonationsCount} Donasi Tersedia`;
            } else {
                const activeClaimsCount = donations.filter(d => d.recipientId === u.id && d.status === "Diklaim").length;
                statusDetail = `${activeClaimsCount} Makanan Diklaim`;
            }
            
            node.innerHTML = `
                <div class="map-node-tooltip">
                    <strong>${u.name}</strong><br>
                    <span>📍 ${u.address}</span><br>
                    <span style="color: ${u.role === 'donor' ? 'var(--primary)' : 'var(--accent)'}; font-weight:600">${statusDetail}</span>
                </div>
            `;
            
            mapNodesContainer.appendChild(node);
        });
    }
    
    // ==========================================================================
    // 7. DONATUR DASHBOARD LOGIC
    // ==========================================================================
    
    function renderDonorOverviewMetrics() {
        const myDonations = donations.filter(d => d.donorId === currentUser.id);
        
        // Total didonasikan (Portion / Porsi)
        const totalQty = myDonations
            .filter(d => d.status === "Diterima" || d.status === "Tersedia" || d.status === "Diklaim" || d.status === "Diambil")
            .reduce((sum, d) => sum + d.quantity, 0);
            
        // Donasi aktif (Tersedia / Diklaim)
        const activeCount = myDonations.filter(d => d.status === "Tersedia" || d.status === "Diklaim").length;
        
        // Penyelamatan sukses (Diterima)
        const successCount = myDonations.filter(d => d.status === "Diterima").length;
        
        // Dampak Lingkungan (CO2 Saved) -> Simulasi: 1 porsi = 2.5 kg emisi gas rumah kaca dicegah
        const co2Saved = (totalQty * 2.5).toFixed(1);
        
        document.getElementById("m-don-total").textContent = totalQty;
        document.getElementById("m-don-active").textContent = activeCount;
        document.getElementById("m-don-success").textContent = successCount;
        document.getElementById("m-don-co2").textContent = `${co2Saved} Kg`;
    }
    
    // Chart Donatur (Chart.js)
    let donorChartInstance = null;
    function renderDonorCharts() {
        const ctx = document.getElementById("chart-donor-stats");
        if (!ctx) return;
        
        if (donorChartInstance) {
            donorChartInstance.destroy();
        }
        
        const myDonations = donations.filter(d => d.donorId === currentUser.id);
        
        // Kelompokkan data porsi berdasarkan Kategori
        const categories = { ready: 0, bread: 0, raw: 0 };
        myDonations.forEach(d => {
            if (d.status !== "Kadaluarsa") {
                if (d.category === "siap_saji") categories.ready += d.quantity;
                else if (d.category === "roti") categories.bread += d.quantity;
                else if (d.category === "bahan_mentah") categories.raw += d.quantity;
            }
        });
        
        donorChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Makanan Siap Saji", "Roti & Kue", "Bahan Mentah"],
                datasets: [{
                    label: "Jumlah Porsi/Kg didistribusikan",
                    data: [categories.ready, categories.bread, categories.raw],
                    backgroundColor: ["#10b981", "#f59e0b", "#6366f1"],
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: "#94a3b8" },
                        grid: { color: "rgba(255, 255, 255, 0.05)" }
                    },
                    x: {
                        ticks: { color: "#94a3b8" },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Tombol Form Donasi Cepat di Overview
    document.getElementById("btn-quick-donate").addEventListener("click", () => {
        const sideLinks = document.querySelectorAll(".sidebar-link");
        if (sideLinks[1]) sideLinks[1].click(); // Pindah ke tab form donasi
    });
    
    // Pembatalan Form Donasi
    document.getElementById("btn-cancel-donate").addEventListener("click", () => {
        document.getElementById("form-add-donation").reset();
        const previewContainer = document.getElementById("photo-preview-container");
        if (previewContainer) previewContainer.style.display = "none";
        
        // Balik ke dashboard overview
        const sideLinks = document.querySelectorAll(".sidebar-link");
        if (sideLinks[0]) sideLinks[0].click();
    });
    
    // Preview File Foto Makanan
    const inputPhoto = document.getElementById("don-photo");
    const photoPreviewContainer = document.getElementById("photo-preview-container");
    const photoPreviewImg = document.getElementById("photo-preview-img");
    let base64PhotoData = "";
    
    if (inputPhoto) {
        inputPhoto.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showToast("Ukuran file gambar maksimal 2MB.", "error");
                    inputPhoto.value = "";
                    photoPreviewContainer.style.display = "none";
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    base64PhotoData = event.target.result;
                    photoPreviewImg.src = base64PhotoData;
                    photoPreviewContainer.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Submit Donasi Baru
    document.getElementById("form-add-donation").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const foodName = document.getElementById("don-food-name").value.trim();
        const category = document.getElementById("don-category").value;
        const quantity = parseInt(document.getElementById("don-quantity").value);
        const unit = document.getElementById("don-unit").value.trim();
        const expiry = document.getElementById("don-expiry").value;
        const notes = document.getElementById("don-notes").value.trim();
        
        if (new Date(expiry) <= new Date()) {
            showToast("Waktu kadaluarsa kelayakan harus di masa depan.", "error");
            return;
        }
        
        const newDonation = {
            id: `don_${Date.now()}`,
            donorId: currentUser.id,
            donorName: currentUser.name,
            foodName,
            category,
            quantity,
            unit,
            createdAt: new Date().toISOString(),
            expiryAt: new Date(expiry).toISOString(),
            photo: base64PhotoData || "", // Gunakan base64 atau string kosong
            address: currentUser.address,
            phone: currentUser.phone,
            notes,
            status: "Tersedia",
            recipientId: null,
            recipientName: null,
            updatedAt: new Date().toISOString()
        };
        
        donations.push(newDonation);
        saveState();
        showToast("Donasi makanan berhasil dipublikasikan!", "success");
        
        // Reset form
        document.getElementById("form-add-donation").reset();
        if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
        base64PhotoData = "";
        
        // Refresh views & alihkan ke tab Daftar Stok
        syncDataViews();
        renderMap();
        
        const sideLinks = document.querySelectorAll(".sidebar-link");
        if (sideLinks[2]) sideLinks[2].click();
    });
    
    // Render Tabel Stok Donasi Saya
    function renderDonorMyDonationsTable() {
        const tbody = document.getElementById("list-donor-donations-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        const myDonations = donations.filter(d => d.donorId === currentUser.id);
        
        if (myDonations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">Anda belum memposting donasi makanan.</td></tr>`;
            return;
        }
        
        // Urutkan berdasarkan tanggal dibuat terbaru
        myDonations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        myDonations.forEach(d => {
            const now = new Date();
            const exp = new Date(d.expiryAt);
            const diffMs = exp - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            let countdownHtml = "";
            if (d.status === "Kadaluarsa") {
                countdownHtml = `<span class="countdown-badge expired">⚠️ Kadaluarsa</span>`;
            } else if (d.status === "Diterima" || d.status === "Diambil") {
                countdownHtml = `<span class="countdown-badge safe">Selesai diselamatkan</span>`;
            } else if (diffHours < 0) {
                countdownHtml = `<span class="countdown-badge expired">⚠️ Kadaluarsa</span>`;
            } else if (diffHours <= 1) {
                countdownHtml = `<span class="countdown-badge urgent">⏱️ ${Math.round(diffHours * 60)} mnt</span>`;
            } else if (diffHours <= 4) {
                countdownHtml = `<span class="countdown-badge warning">⏳ ${diffHours.toFixed(1)} jam</span>`;
            } else {
                countdownHtml = `<span class="countdown-badge safe">⏳ ${Math.round(diffHours)} jam</span>`;
            }
            
            let statusBadge = "";
            if (d.status === "Tersedia") statusBadge = `<span class="badge badge-success">Tersedia</span>`;
            else if (d.status === "Diklaim") statusBadge = `<span class="badge badge-warning">Diklaim</span>`;
            else if (d.status === "Diterima") statusBadge = `<span class="badge badge-info">Diterima</span>`;
            else if (d.status === "Kadaluarsa") statusBadge = `<span class="badge badge-danger">Kadaluarsa</span>`;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="font-weight:600">${d.foodName}</td>
                <td><span class="badge badge-secondary">${d.category.replace('_', ' ')}</span></td>
                <td>${d.quantity} ${d.unit}</td>
                <td>${countdownHtml}</td>
                <td>${statusBadge}</td>
                <td>${d.recipientName || '<span style="color:var(--text-muted)">-</span>'}</td>
                <td>
                    ${d.status === 'Tersedia' ? `<button class="btn btn-danger btn-sm btn-delete-don" data-id="${d.id}">Batalkan</button>` : ''}
                    ${d.status === 'Diklaim' ? `<button class="btn btn-primary btn-sm btn-confirm-delivery" data-id="${d.id}">Konfirmasi Penjemputan</button>` : ''}
                    ${d.status === 'Diterima' || d.status === 'Kadaluarsa' ? '<span style="color:var(--text-muted); font-size:12px;">Tidak ada aksi</span>' : ''}
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Event Listeners untuk tabel aksi donatur
        tbody.querySelectorAll(".btn-delete-don").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const donId = e.target.getAttribute("data-id");
                if (confirm("Apakah Anda yakin ingin membatalkan donasi ini?")) {
                    donations = donations.filter(d => d.id !== donId);
                    saveState();
                    showToast("Donasi makanan berhasil dibatalkan.", "info");
                    syncDataViews();
                    renderMap();
                }
            });
        });
        
        tbody.querySelectorAll(".btn-confirm-delivery").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const donId = e.target.getAttribute("data-id");
                const don = donations.find(d => d.id === donId);
                if (don) {
                    don.status = "Diterima";
                    don.updatedAt = new Date().toISOString();
                    saveState();
                    showToast("Konfirmasi penjemputan berhasil diselesaikan!", "success");
                    syncDataViews();
                }
            });
        });
    }
    
    // Render Daftar Permintaan Panti (Bagi Donatur untuk membantu panti)
    function renderDonorRequestsList() {
        const container = document.getElementById("list-donor-requests-container");
        if (!container) return;
        
        container.innerHTML = "";
        const activeRequests = requests.filter(r => r.status === "Menunggu");
        
        if (activeRequests.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    🎉 Semua permintaan panti asuhan saat ini sudah terpenuhi. Terima kasih atas kepedulian Anda!
                </div>
            `;
            return;
        }
        
        activeRequests.forEach(req => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBottom = "16px";
            card.style.borderLeft = "4px solid var(--accent)";
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h4 style="color:var(--text-primary); font-size: 16px; margin-bottom: 4px;">${req.foodType}</h4>
                        <span class="badge badge-secondary" style="margin-bottom: 8px;">🏠 ${req.recipientName}</span>
                        <p style="font-size:13px; color: var(--text-secondary); margin-bottom: 12px;">"${req.notes}"</p>
                        <div style="font-size: 12px; color: var(--text-muted)">
                            Kebutuhan: <strong>${req.quantity} ${req.unit}</strong> | Diposting: ${new Date(req.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <button class="btn btn-accent btn-sm btn-fulfill-request" data-id="${req.id}">Penuhi Permintaan</button>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        // Event Fulfill Request
        container.querySelectorAll(".btn-fulfill-request").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const reqId = e.target.getAttribute("data-id");
                const req = requests.find(r => r.id === reqId);
                if (req) {
                    if (confirm(`Apakah Anda siap menyumbangkan makanan untuk memenuhi kebutuhan "${req.foodType}" dari ${req.recipientName}?`)) {
                        req.status = "Terpenuhi";
                        req.fulfilledById = currentUser.id;
                        req.fulfilledByName = currentUser.name;
                        
                        // Tambahkan sebagai donasi selesai otomatis
                        const simulatedDonation = {
                            id: `don_fulfill_${Date.now()}`,
                            donorId: currentUser.id,
                            donorName: currentUser.name,
                            foodName: `Pemenuhan: ${req.foodType}`,
                            category: "siap_saji", // default category
                            quantity: req.quantity,
                            unit: req.unit,
                            createdAt: new Date().toISOString(),
                            expiryAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 jam kelayakan
                            photo: "",
                            address: currentUser.address,
                            phone: currentUser.phone,
                            notes: `Donasi langsung untuk memenuhi kebutuhan pangan panti asuhan.`,
                            status: "Diterima", // Selesai
                            recipientId: req.recipientId,
                            recipientName: req.recipientName,
                            updatedAt: new Date().toISOString()
                        };
                        
                        donations.push(simulatedDonation);
                        saveState();
                        showToast(`Anda berhasil menyetujui pemenuhan permintaan ${req.recipientName}! Hubungi panti asuhan untuk distribusi.`, "success");
                        syncDataViews();
                    }
                }
            });
        });
    }
    
    // ==========================================================================
    // 8. PENERIMA (PANTI ASUHAN) DASHBOARD LOGIC
    // ==========================================================================
    
    // Pencarian, filter, dan sorting katalog makanan
    const catalogSearchInput = document.getElementById("catalog-search");
    const catalogFilterCategory = document.getElementById("catalog-filter-category");
    const catalogSort = document.getElementById("catalog-sort");
    
    if (catalogSearchInput) {
        catalogSearchInput.addEventListener("input", renderRecipientCatalog);
    }
    if (catalogFilterCategory) {
        catalogFilterCategory.addEventListener("change", renderRecipientCatalog);
    }
    if (catalogSort) {
        catalogSort.addEventListener("change", renderRecipientCatalog);
    }
    
    function renderRecipientCatalog() {
        const grid = document.getElementById("catalog-food-list");
        if (!grid) return;
        
        grid.innerHTML = "";
        
        const searchQuery = catalogSearchInput ? catalogSearchInput.value.trim().toLowerCase() : "";
        const filterCat = catalogFilterCategory ? catalogFilterCategory.value : "";
        const sortBy = catalogSort ? catalogSort.value : "expiry_asc";
        
        // Filter donasi berstatus "Tersedia"
        let list = donations.filter(d => d.status === "Tersedia");
        
        // Tambahkan filter kelayakan (harus belum kadaluarsa)
        const now = new Date();
        list = list.filter(d => new Date(d.expiryAt) > now);
        
        // Filter Pencarian
        if (searchQuery) {
            list = list.filter(d => 
                d.foodName.toLowerCase().includes(searchQuery) || 
                d.donorName.toLowerCase().includes(searchQuery)
            );
        }
        
        // Filter Kategori
        if (filterCat) {
            list = list.filter(d => d.category === filterCat);
        }
        
        // Sorting data
        if (sortBy === "expiry_asc") {
            list.sort((a, b) => new Date(a.expiryAt) - new Date(b.expiryAt));
        } else if (sortBy === "date_desc") {
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === "qty_desc") {
            list.sort((a, b) => b.quantity - a.quantity);
        }
        
        if (list.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);" class="card">
                    🍲 Tidak ada donasi makanan tersedia yang cocok dengan filter pencarian Anda saat ini.
                </div>
            `;
            return;
        }
        
        list.forEach(d => {
            const exp = new Date(d.expiryAt);
            const diffMs = exp - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            let badgeColor = "badge-success";
            let timeText = "";
            if (diffHours <= 1) {
                badgeColor = "badge-danger";
                timeText = `${Math.round(diffHours * 60)} mnt lagi`;
            } else if (diffHours <= 4) {
                badgeColor = "badge-warning";
                timeText = `${diffHours.toFixed(1)} jam lagi`;
            } else {
                timeText = `${Math.round(diffHours)} jam lagi`;
            }
            
            // Photo rendering (gunakan base64 jika ada, jika tidak pakai class svg css)
            let photoStyle = "";
            let photoClass = `food-card-photo photo-${d.category}`;
            if (d.photo) {
                photoStyle = `style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url('${d.photo}')"`;
                photoClass = "food-card-photo";
            }
            
            const card = document.createElement("div");
            card.className = "card food-card";
            card.innerHTML = `
                <div class="${photoClass}" ${photoStyle}>
                    <span class="badge ${badgeColor} food-card-category">⏳ ${timeText}</span>
                </div>
                <div class="food-card-body">
                    <h3 class="food-card-title">${d.foodName}</h3>
                    <div class="food-card-donor">🏢 <span>${d.donorName}</span></div>
                    
                    <div class="food-card-info-row">
                        <div class="food-card-info-item">
                            <span class="lbl">Kuantitas</span>
                            <span class="val" style="color:var(--primary)">${d.quantity} ${d.unit}</span>
                        </div>
                        <div class="food-card-info-item" style="text-align: right">
                            <span class="lbl">Kategori</span>
                            <span class="val" style="text-transform: capitalize;">${d.category.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>
                <div class="food-card-action">
                    <button class="btn btn-accent btn-claim-food" data-id="${d.id}" style="width: 100%">Klaim Porsi Makanan</button>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        // Action click claim
        grid.querySelectorAll(".btn-claim-food").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const donId = e.target.getAttribute("data-id");
                const don = donations.find(d => d.id === donId);
                if (don) {
                    if (confirm(`Apakah Anda yakin ingin mengklaim ${don.quantity} ${don.unit} "${don.foodName}" dari ${don.donorName}? Anda wajib melakukan penjemputan fisik.`)) {
                        don.status = "Diklaim";
                        don.recipientId = currentUser.id;
                        don.recipientName = currentUser.name;
                        don.updatedAt = new Date().toISOString();
                        
                        saveState();
                        showToast(`Makanan berhasil diklaim! Silakan cek menu "Klaim Saya" untuk instruksi penjemputan.`, "success");
                        
                        syncDataViews();
                        renderMap();
                        
                        // Alihkan ke tab Klaim Saya
                        const sideLinks = document.querySelectorAll(".sidebar-link");
                        if (sideLinks[1]) sideLinks[1].click();
                    }
                }
            });
        });
    }
    
    // Render Tabel Klaim Saya (Penjemputan Panti)
    function renderRecipientClaimsTable() {
        const tbody = document.getElementById("list-recipient-claims-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        const myClaims = donations.filter(d => d.recipientId === currentUser.id && d.status === "Diklaim");
        
        if (myClaims.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">Anda tidak sedang mengklaim donasi makanan saat ini.</td></tr>`;
            return;
        }
        
        myClaims.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="font-weight:600">${c.foodName} (${c.quantity} ${c.unit})</td>
                <td>${c.donorName}</td>
                <td>📍 ${c.address}</td>
                <td>📞 ${c.phone}</td>
                <td><span class="badge badge-warning">Proses Jemput</span></td>
                <td>
                    <div style="display:flex; gap: 8px;">
                        <button class="btn btn-primary btn-sm btn-receive-food" data-id="${c.id}">Makanan Diterima</button>
                        <button class="btn btn-secondary btn-sm btn-cancel-claim" data-id="${c.id}">Batal Klaim</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Event listener terima & batal klaim
        tbody.querySelectorAll(".btn-receive-food").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const claimId = e.target.getAttribute("data-id");
                const claim = donations.find(d => d.id === claimId);
                if (claim) {
                    claim.status = "Diterima";
                    claim.updatedAt = new Date().toISOString();
                    saveState();
                    showToast("Alhamdulillah! Transaksi donasi selesai, makanan telah sukses didistribusikan ke panti asuhan.", "success");
                    syncDataViews();
                }
            });
        });
        
        tbody.querySelectorAll(".btn-cancel-claim").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const claimId = e.target.getAttribute("data-id");
                const claim = donations.find(d => d.id === claimId);
                if (claim) {
                    if (confirm("Batalkan klaim? Makanan akan dikembalikan ke katalog agar bisa diambil panti asuhan lainnya.")) {
                        claim.status = "Tersedia";
                        claim.recipientId = null;
                        claim.recipientName = null;
                        claim.updatedAt = new Date().toISOString();
                        saveState();
                        showToast("Klaim donasi dibatalkan.", "info");
                        syncDataViews();
                        renderMap();
                    }
                }
            });
        });
    }
    
    // Submit Kebutuhan Baru dari Panti
    const formAddRequest = document.getElementById("form-add-request");
    if (formAddRequest) {
        formAddRequest.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const foodType = document.getElementById("req-food-type").value.trim();
            const quantity = parseInt(document.getElementById("req-quantity").value);
            const unit = document.getElementById("req-unit").value.trim();
            const notes = document.getElementById("req-notes").value.trim();
            
            const newRequest = {
                id: `req_${Date.now()}`,
                recipientId: currentUser.id,
                recipientName: currentUser.name,
                foodType,
                quantity,
                unit,
                notes,
                createdAt: new Date().toISOString(),
                status: "Menunggu",
                fulfilledById: null,
                fulfilledByName: null
            };
            
            requests.push(newRequest);
            saveState();
            showToast("Permintaan pangan mendesak berhasil di-posting!", "success");
            
            formAddRequest.reset();
            syncDataViews();
        });
    }
    
    // Render Riwayat Permintaan Panti Sendiri
    function renderRecipientMyRequestsTable() {
        const tbody = document.getElementById("list-my-requests-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        const myRequests = requests.filter(r => r.recipientId === currentUser.id);
        
        if (myRequests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">Anda belum pernah mengajukan permintaan.</td></tr>`;
            return;
        }
        
        myRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        myRequests.forEach(r => {
            let statusBadge = "";
            if (r.status === "Menunggu") statusBadge = `<span class="badge badge-warning">Menunggu Donatur</span>`;
            else if (r.status === "Terpenuhi") statusBadge = `<span class="badge badge-success">Terpenuhi</span>`;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div style="font-weight:600">${r.foodType}</div>
                    <div style="font-size:11px; color:var(--text-muted)">Jumlah: ${r.quantity} ${r.unit}</div>
                </td>
                <td>${statusBadge}</td>
                <td>${r.fulfilledByName || '<span style="color:var(--text-muted)">Belum terpenuhi</span>'}</td>
                <td>
                    ${r.status === 'Menunggu' ? `<button class="btn btn-danger btn-sm btn-delete-req" data-id="${r.id}">Hapus</button>` : '<span style="color:var(--text-muted)">-</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Hapus Request
        tbody.querySelectorAll(".btn-delete-req").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const reqId = e.target.getAttribute("data-id");
                if (confirm("Apakah Anda ingin menghapus postingan permintaan ini?")) {
                    requests = requests.filter(r => r.id !== reqId);
                    saveState();
                    showToast("Permintaan makanan berhasil dihapus.", "info");
                    syncDataViews();
                }
            });
        });
    }
    
    // ==========================================================================
    // 9. ADMINISTRATOR DASHBOARD LOGIC
    // ==========================================================================
    
    function renderAdminOverviewMetrics() {
        // Total penyelamatan (Portion / Porsi yang berstatus Diterima)
        const totalSaved = donations
            .filter(d => d.status === "Diterima")
            .reduce((sum, d) => sum + d.quantity, 0);
            
        // Stok aktif
        const activeCount = donations.filter(d => d.status === "Tersedia").length;
        
        // Total donatur terdaftar & diverifikasi
        const donorCount = users.filter(u => u.role === "donor" && u.verified).length;
        
        // Total panti terdaftar & diverifikasi
        const recipientCount = users.filter(u => u.role === "recipient" && u.verified).length;
        
        document.getElementById("m-adm-saved").textContent = totalSaved;
        document.getElementById("m-adm-active").textContent = activeCount;
        document.getElementById("m-adm-donors").textContent = donorCount;
        document.getElementById("m-adm-recipients").textContent = recipientCount;
    }
    
    // Render chart visualisasi admin
    let adminMonthlyChart = null;
    let adminCategoriesChart = null;
    
    function renderAdminCharts() {
        const ctxMonthly = document.getElementById("chart-admin-monthly");
        const ctxCategories = document.getElementById("chart-admin-categories");
        
        if (!ctxMonthly || !ctxCategories) return;
        
        // Reset Chart Instances
        if (adminMonthlyChart) adminMonthlyChart.destroy();
        if (adminCategoriesChart) adminCategoriesChart.destroy();
        
        // Kumpulkan data bulanan simulasi
        // Di Lumajang, simulasikan data laju penyelamatan bulanan (Jan - Jun)
        adminMonthlyChart = new Chart(ctxMonthly, {
            type: "line",
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
                datasets: [{
                    label: "Penyelamatan Pangan (Porsi)",
                    data: [120, 190, 300, 500, 750, 950],
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255, 255, 255, 0.05)" } },
                    x: { ticks: { color: "#94a3b8" }, grid: { display: false } }
                }
            }
        });
        
        // Hitung proporsi kategori donasi saat ini
        const categories = { siap_saji: 0, roti: 0, bahan_mentah: 0 };
        donations.forEach(d => {
            if (categories.hasOwnProperty(d.category)) {
                categories[d.category] += d.quantity;
            }
        });
        
        adminCategoriesChart = new Chart(ctxCategories, {
            type: "doughnut",
            data: {
                labels: ["Siap Saji", "Roti/Kue", "Bahan Mentah"],
                datasets: [{
                    data: [categories.siap_saji, categories.roti, categories.bahan_mentah],
                    backgroundColor: ["#10b981", "#f59e0b", "#6366f1"],
                    borderColor: "#1e293b",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { color: "#94a3b8", font: { size: 11 } }
                    }
                }
            }
        });
    }
    
    // Render list verifikasi pendaftaran akun baru
    function renderAdminVerifyLists() {
        const donorContainer = document.getElementById("verify-donors-container");
        const recipientContainer = document.getElementById("verify-recipients-container");
        const badgeDonorCount = document.getElementById("badge-count-verify-donor");
        const badgeRecipientCount = document.getElementById("badge-count-verify-recipient");
        
        if (!donorContainer || !recipientContainer) return;
        
        donorContainer.innerHTML = "";
        recipientContainer.innerHTML = "";
        
        const pendingDonors = users.filter(u => u.role === "donor" && !u.verified);
        const pendingRecipients = users.filter(u => u.role === "recipient" && !u.verified);
        
        badgeDonorCount.textContent = pendingDonors.length;
        badgeRecipientCount.textContent = pendingRecipients.length;
        
        // Render Donatur Pending
        if (pendingDonors.length === 0) {
            donorContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:13px;">Tidak ada pendaftaran donatur baru.</div>`;
        } else {
            pendingDonors.forEach(u => {
                const div = document.createElement("div");
                div.className = "card";
                div.style.padding = "16px";
                div.style.background = "rgba(15, 23, 42, 0.4)";
                
                div.innerHTML = `
                    <h4 style="font-size:15px; margin-bottom:4px;">${u.name}</h4>
                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">📍 ${u.address}</p>
                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">Telp/WA: ${u.phone} | Username: ${u.username}</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary btn-sm btn-verify-user" data-id="${u.id}" style="flex:1;">Verifikasi</button>
                        <button class="btn btn-secondary btn-sm btn-reject-user" data-id="${u.id}">Tolak</button>
                    </div>
                `;
                donorContainer.appendChild(div);
            });
        }
        
        // Render Penerima Pending
        if (pendingRecipients.length === 0) {
            recipientContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:13px;">Tidak ada pendaftaran panti asuhan baru.</div>`;
        } else {
            pendingRecipients.forEach(u => {
                const div = document.createElement("div");
                div.className = "card";
                div.style.padding = "16px";
                div.style.background = "rgba(15, 23, 42, 0.4)";
                
                div.innerHTML = `
                    <h4 style="font-size:15px; margin-bottom:4px;">${u.name}</h4>
                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">📍 ${u.address}</p>
                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">Telp/WA: ${u.phone} | Username: ${u.username}</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-accent btn-sm btn-verify-user" data-id="${u.id}" style="flex:1;">Verifikasi</button>
                        <button class="btn btn-secondary btn-sm btn-reject-user" data-id="${u.id}">Tolak</button>
                    </div>
                `;
                recipientContainer.appendChild(div);
            });
        }
        
        // Event verification actions
        document.querySelectorAll(".btn-verify-user").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const userId = e.target.getAttribute("data-id");
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.verified = true;
                    saveState();
                    showToast(`Akun "${user.name}" berhasil diverifikasi dan aktif!`, "success");
                    syncDataViews();
                    renderMap();
                }
            });
        });
        
        document.querySelectorAll(".btn-reject-user").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const userId = e.target.getAttribute("data-id");
                const user = users.find(u => u.id === userId);
                if (user) {
                    if (confirm(`Apakah Anda yakin ingin menolak & menghapus pendaftaran dari "${user.name}"?`)) {
                        users = users.filter(u => u.id !== userId);
                        saveState();
                        showToast(`Pendaftaran "${user.name}" telah ditolak.`, "info");
                        syncDataViews();
                    }
                }
            });
        });
    }
    
    // Render Tabel Monitoring Transaksi Global Admin
    function renderAdminGlobalLogsTable() {
        const tbody = document.getElementById("list-admin-transactions-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        if (donations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">Belum ada transaksi donasi di platform.</td></tr>`;
            return;
        }
        
        // Urutkan transaksi terbaru di atas
        const sortedLogs = [...donations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        sortedLogs.forEach(d => {
            let statusBadge = "";
            if (d.status === "Tersedia") statusBadge = `<span class="badge badge-success">Tersedia</span>`;
            else if (d.status === "Diklaim") statusBadge = `<span class="badge badge-warning">Diklaim</span>`;
            else if (d.status === "Diterima") statusBadge = `<span class="badge badge-info">Selesai</span>`;
            else if (d.status === "Kadaluarsa") statusBadge = `<span class="badge badge-danger">Kadaluarsa</span>`;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><code>${d.id.substring(0, 10)}</code></td>
                <td style="font-weight:600">${d.foodName} (${d.quantity} ${d.unit})</td>
                <td>${d.donorName}</td>
                <td>${d.recipientName || '<span style="color:var(--text-muted)">-</span>'}</td>
                <td>${new Date(d.expiryAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} / ${new Date(d.expiryAt).toLocaleDateString()}</td>
                <td>${statusBadge}</td>
                <td style="font-size:12px; color:var(--text-secondary)">${d.notes.substring(0, 40)}${d.notes.length > 40 ? '...' : ''}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // ==========================================================================
    // 10. APP INITIAL RENDER RUNNER
    // ==========================================================================
    renderApp();
});
