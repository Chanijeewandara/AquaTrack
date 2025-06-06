// Configuration
const CONFIG = {
    THINGSPEAK: {
        CHANNEL_ID: '2981979',
        READ_API_KEY: '7RMX1WDAP41K4HC5',
        WRITE_API_KEY: 'J3IJ6N2QHVLEM391',
        BASE_URL: 'https://api.thingspeak.com'
    },
    WIFI: {
        SSID: "Chani's Galaxy A03s",
        PASSWORD: "123456789"
    },
    LOGIN: {
        USERNAME: 'admin',
        PASSWORD: 'aquatrack123'
    },
    UPDATE_INTERVAL: 15000
};

let chart;
let updateInterval;
let consumptionData = [];
let timeLabels = [];

// Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (username === CONFIG.LOGIN.USERNAME && password === CONFIG.LOGIN.PASSWORD) {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        initializeDashboard();
    } else {
        errorMessage.classList.remove('hidden');
    }
});

document.getElementById('exitBtn').addEventListener('click', () => {
    clearInterval(updateInterval);
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
});

// Init Dashboard
function initializeDashboard() {
    initializeChart();
    fetchThingSpeakData();
    updateInterval = setInterval(fetchThingSpeakData, CONFIG.UPDATE_INTERVAL);
}

function initializeChart() {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Water Consumption (L)',
                data: consumptionData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100, // LIMIT GRAPH HEIGHT
                    title: { display: true, text: 'Liters' }
                },
                x: {
                    title: { display: true, text: 'Time' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

async function fetchThingSpeakData() {
    try {
        const url = `${CONFIG.THINGSPEAK.BASE_URL}/channels/${CONFIG.THINGSPEAK.CHANNEL_ID}/feeds.json?api_key=${CONFIG.THINGSPEAK.READ_API_KEY}&results=20`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.feeds) {
            processThingSpeakData(data.feeds);
            updateLastUpdateTime();
        }
    } catch (e) {
        console.error('ThingSpeak error:', e);
    }
}

function processThingSpeakData(feeds) {
    consumptionData.length = 0;
    timeLabels.length = 0;

    feeds.forEach(feed => {
        const time = new Date(feed.created_at);
        timeLabels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        consumptionData.push(parseFloat(feed.field3) || 0);
    });

    chart.data.labels = timeLabels;
    chart.data.datasets[0].data = consumptionData;
    chart.update();

    const latest = feeds[feeds.length - 1];
    updateFlowRate(latest.field1);
    updateSolenoidStatus(latest.field2);
}

function updateFlowRate(value) {
    const el = document.getElementById('flowRate');
    const loader = document.getElementById('flowRateLoading');
    const rate = parseFloat(value) || 0;
    el.textContent = `${rate.toFixed(1)} L/min`;
    loader.style.display = 'none';
}

function updateSolenoidStatus(value) {
    const indicator = document.getElementById('solenoidIndicator');
    const text = document.getElementById('solenoidText');
    const warning = document.getElementById('leakageWarning');
    const isOn = value === '1' || value === 1;

    indicator.className = `status-indicator ${isOn ? 'status-on' : 'status-off'}`;
    text.textContent = isOn ? 'ON' : 'OFF';
    text.style.color = isOn ? '#2ed573' : '#ff4757';
    warning.classList.toggle('hidden', isOn);
}

function updateLastUpdateTime() {
    document.getElementById('lastUpdate').textContent =
        `Last updated: ${new Date().toLocaleString()}`;
}
