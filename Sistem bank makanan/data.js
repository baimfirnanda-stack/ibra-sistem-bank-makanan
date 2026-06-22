/**
 * data.js
 * Inisialisasi Mock Data awal untuk Sistem Bank Makanan.
 * Data ini akan disimpan ke dalam localStorage saat aplikasi pertama kali dimuat.
 */

// Helper untuk menghitung waktu relatif terhadap waktu saat ini (dalam jam)
function getFutureTime(hoursAhead) {
    const date = new Date();
    date.setHours(date.getHours() + hoursAhead);
    return date.toISOString();
}

function getPastTime(hoursAgo) {
    const date = new Date();
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
}

const INITIAL_USERS = [
    {
        id: "usr_admin",
        username: "admin",
        password: "admin123",
        name: "Admin Pusat (Dicky)",
        role: "admin",
        verified: true,
        phone: "081234567890",
        address: "Kantor Dinsos, Jl. Alun-Alun Lumajang No. 5",
        city: "Lumajang"
    },
    {
        id: "usr_don_1",
        username: "hotel_plaza",
        password: "donor123",
        name: "Hotel Lumajang Plaza",
        role: "donor",
        verified: true,
        phone: "081223344556",
        address: "Jl. Panglima Besar Sudirman No. 88",
        city: "Lumajang",
        latitude: -8.1324,
        longitude: 113.2244
    },
    {
        id: "usr_don_2",
        username: "resto_selera",
        password: "donor123",
        name: "Resto Selera Rakyat",
        role: "donor",
        verified: true,
        phone: "081299887766",
        address: "Jl. Kyai H. Wahid Hasyim No. 12",
        city: "Lumajang",
        latitude: -8.1352,
        longitude: 113.2212
    },
    {
        id: "usr_don_3",
        username: "bakery_citra",
        password: "donor123",
        name: "Bakery Citra Rasa",
        role: "donor",
        verified: false, // Akun baru, belum diverifikasi
        phone: "085744332211",
        address: "Jl. Jenderal Ahmad Yani No. 45",
        city: "Lumajang",
        latitude: -8.1301,
        longitude: 113.2289
    },
    {
        id: "usr_rec_1",
        username: "panti_kasih",
        password: "panti123",
        name: "Panti Asuhan Kasih Ibu",
        role: "recipient",
        verified: true,
        phone: "082133445566",
        address: "Jl. Veteran No. 104, Lumajang",
        city: "Lumajang",
        latitude: -8.1398,
        longitude: 113.2198
    },
    {
        id: "usr_rec_2",
        username: "panti_harapan",
        password: "panti123",
        name: "Panti Asuhan Harapan Bangsa",
        role: "recipient",
        verified: true,
        phone: "083811223344",
        address: "Jl. Gajah Mada No. 19, Lumajang",
        city: "Lumajang",
        latitude: -8.1415,
        longitude: 113.2255
    },
    {
        id: "usr_rec_3",
        username: "peduli_sesama",
        password: "panti123",
        name: "Komunitas Peduli Sesama Lumajang",
        role: "recipient",
        verified: false, // Akun baru, belum diverifikasi
        phone: "089677889900",
        address: "Gg. Damai No. 3, Tompokersan, Lumajang",
        city: "Lumajang",
        latitude: -8.1278,
        longitude: 113.2321
    }
];

const INITIAL_DONATIONS = [
    {
        id: "don_1",
        donorId: "usr_don_1",
        donorName: "Hotel Lumajang Plaza",
        foodName: "Nasi Kotak Ayam Bakar (Surplus Prasmanan)",
        category: "siap_saji", // siap_saji, roti, bahan_mentah
        quantity: 25,
        unit: "Porsi",
        createdAt: getPastTime(1),
        expiryAt: getFutureTime(3), // Kadaluarsa dalam 3 jam ke depan
        photo: "", // Kosong berarti menggunakan placeholder bawaan kategori
        address: "Jl. Panglima Besar Sudirman No. 88 (Lobi Utama)",
        phone: "081223344556",
        notes: "Kondisi sangat baik, hangat, baru dikemas jam 15.00. Sudah termasuk sendok plastik.",
        status: "Tersedia", // Tersedia, Diklaim, Diambil, Diterima, Kadaluarsa
        recipientId: null,
        recipientName: null,
        updatedAt: getPastTime(1)
    },
    {
        id: "don_2",
        donorId: "usr_don_2",
        donorName: "Resto Selera Rakyat",
        foodName: "Roti Manis Aneka Rasa (Cokelat & Keju)",
        category: "roti",
        quantity: 40,
        unit: "Buah",
        createdAt: getPastTime(2),
        expiryAt: getFutureTime(8), // Kadaluarsa dalam 8 jam ke depan
        photo: "",
        address: "Jl. Kyai H. Wahid Hasyim No. 12 (Kasir)",
        phone: "081299887766",
        notes: "Diproduksi pagi ini. Masih empuk dan layak konsumsi hingga besok pagi.",
        status: "Tersedia",
        recipientId: null,
        recipientName: null,
        updatedAt: getPastTime(2)
    },
    {
        id: "don_3",
        donorId: "usr_don_2",
        donorName: "Resto Selera Rakyat",
        foodName: "Bahan Mentah Wortel dan Sayur Kol Segar",
        category: "bahan_mentah",
        quantity: 12,
        unit: "Kg",
        createdAt: getPastTime(4),
        expiryAt: getFutureTime(24), // Kadaluarsa dalam 24 jam ke depan
        photo: "",
        address: "Jl. Kyai H. Wahid Hasyim No. 12 (Gudang Belakang)",
        phone: "081299887766",
        notes: "Sisa bahan masak pagi ini, kondisi segar dalam kulkas box.",
        status: "Tersedia",
        recipientId: null,
        recipientName: null,
        updatedAt: getPastTime(4)
    },
    {
        id: "don_4",
        donorId: "usr_don_1",
        donorName: "Hotel Lumajang Plaza",
        foodName: "Sop Buntut & Nasi Putih",
        category: "siap_saji",
        quantity: 15,
        unit: "Porsi",
        createdAt: getPastTime(6),
        expiryAt: getFutureTime(0.5), // Peringatan Dini! Kadaluarsa dalam 30 menit
        photo: "",
        address: "Jl. Panglima Besar Sudirman No. 88",
        phone: "081223344556",
        notes: "Harus segera dijemput dan dihangatkan kembali.",
        status: "Tersedia",
        recipientId: null,
        recipientName: null,
        updatedAt: getPastTime(6)
    },
    {
        id: "don_5",
        donorId: "usr_don_2",
        donorName: "Resto Selera Rakyat",
        foodName: "Nasi Goreng Spesial Pedas",
        category: "siap_saji",
        quantity: 30,
        unit: "Porsi",
        createdAt: getPastTime(12),
        expiryAt: getPastTime(2), // Sudah kadaluarsa 2 jam yang lalu
        photo: "",
        address: "Jl. Kyai H. Wahid Hasyim No. 12",
        phone: "081299887766",
        notes: "Sudah tidak layak, sistem harus otomatis menandai Kadaluarsa.",
        status: "Kadaluarsa",
        recipientId: null,
        recipientName: null,
        updatedAt: getPastTime(2)
    },
    {
        id: "don_6",
        donorId: "usr_don_1",
        donorName: "Hotel Lumajang Plaza",
        foodName: "Sup Ayam Jahe Hangat",
        category: "siap_saji",
        quantity: 20,
        unit: "Porsi",
        createdAt: getPastTime(5),
        expiryAt: getFutureTime(2),
        photo: "",
        address: "Jl. Panglima Besar Sudirman No. 88",
        phone: "081223344556",
        notes: "Disediakan wadah rantang besar, panti asuhan harap membawa wadah sendiri saat menjemput.",
        status: "Diklaim", // Sedang diklaim oleh panti asuhan
        recipientId: "usr_rec_1",
        recipientName: "Panti Asuhan Kasih Ibu",
        updatedAt: getPastTime(2)
    },
    {
        id: "don_7",
        donorId: "usr_don_2",
        donorName: "Resto Selera Rakyat",
        foodName: "Mie Goreng Sayur",
        category: "siap_saji",
        quantity: 50,
        unit: "Porsi",
        createdAt: getPastTime(24),
        expiryAt: getPastTime(18),
        photo: "",
        address: "Jl. Kyai H. Wahid Hasyim No. 12",
        phone: "081299887766",
        notes: "Donasi kemarin yang berhasil diselamatkan dan sukses didistribusikan.",
        status: "Diterima", // Selesai diselamatkan
        recipientId: "usr_rec_2",
        recipientName: "Panti Asuhan Harapan Bangsa",
        updatedAt: getPastTime(23)
    }
];

const INITIAL_REQUESTS = [
    {
        id: "req_1",
        recipientId: "usr_rec_2",
        recipientName: "Panti Asuhan Harapan Bangsa",
        foodType: "Bahan Mentah (Beras, Minyak, Telur)",
        quantity: 5,
        unit: "Paket Sembako",
        notes: "Stok bahan makanan di panti asuhan menipis untuk kebutuhan makan malam 40 anak yatim.",
        createdAt: getPastTime(3),
        status: "Menunggu", // Menunggu, Terpenuhi
        fulfilledById: null,
        fulfilledByName: null
    },
    {
        id: "req_2",
        recipientId: "usr_rec_1",
        recipientName: "Panti Asuhan Kasih Ibu",
        foodType: "Makanan Siap Saji Lauk Pauk",
        quantity: 35,
        unit: "Porsi",
        notes: "Untuk santap siang anak-anak panti asuhan karena jadwal masak kami terganggu hari ini.",
        createdAt: getPastTime(8),
        status: "Terpenuhi",
        fulfilledById: "usr_don_1",
        fulfilledByName: "Hotel Lumajang Plaza"
    }
];

// Ekspor data ke window object agar bisa diakses oleh skrip lain (app.js)
window.INITIAL_USERS = INITIAL_USERS;
window.INITIAL_DONATIONS = INITIAL_DONATIONS;
window.INITIAL_REQUESTS = INITIAL_REQUESTS;
