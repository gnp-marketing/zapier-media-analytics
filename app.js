/**
 * Zapier Dashboard Interactive Core Logic
 * Powered by ApexCharts & Vanilla JavaScript
 */

let barChart = null;
let lineChart = null;
let currentGroup = 'Review';
let currentTopN = 15;
let selectedMedia = null;

const themeColors = {
    'Review': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' },
    'News': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' },
    'YouTube': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' }
};

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeScoreboard();
    initializeCharts();
    initializeParameterControl();
    selectGroup('Review');

    const dateSpan = document.getElementById('current-date');
    if (dateSpan) {
        const today = new Date();
        dateSpan.innerText = today.toISOString().split('T')[0];
    }
});

/**
 * Initialize Theme System
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);

    const lightBtn = document.getElementById('btn-light-theme');
    const darkBtn = document.getElementById('btn-dark-theme');

    if (theme === 'light') {
        lightBtn?.classList.add('active');
        darkBtn?.classList.remove('active');
    } else {
        lightBtn?.classList.remove('active');
        darkBtn?.classList.add('active');
    }

    if (barChart) barChart.updateOptions({ theme: theme === 'light' ? 'light' : 'dark' });
    if (lineChart) lineChart.updateOptions({ theme: theme === 'light' ? 'light' : 'dark' });
}

/**
 * Populate Scoreboard Metrics
 */
function initializeScoreboard() {
    if (!window.dashboardData) {
        console.error("Dashboard data not found");
        return;
    }

    const data = window.dashboardData;

    if (data.Review) {
        document.getElementById('review-distinct-media').innerText = data.Review.scoreboard.distinct_media.toLocaleString();
        document.getElementById('review-total-count').innerText = data.Review.scoreboard.total.toLocaleString();
    }

    if (data.News) {
        document.getElementById('news-distinct-media').innerText = data.News.scoreboard.distinct_media.toLocaleString();
        document.getElementById('news-total-count').innerText = data.News.scoreboard.total.toLocaleString();
    }

    if (data.YouTube) {
        document.getElementById('youtube-distinct-media').innerText = data.YouTube.scoreboard.distinct_media.toLocaleString();
        document.getElementById('youtube-total-count').innerText = data.YouTube.scoreboard.total.toLocaleString();
    }
}

/**
 * Initialize Parameter Control (Top N Slider)
 */
function initializeParameterControl() {
    const slider = document.getElementById('top-n-slider');
    const display = document.getElementById('param-display');

    slider.addEventListener('input', (e) => {
        currentTopN = parseInt(e.target.value);
        display.innerText = currentTopN;
        updateBarChart();
    });
}

/**
 * Initialize Chart Instances
 */
function initializeCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const barOptions = {
        series: [{ name: '數據總量', data: [] }],
        chart: {
            type: 'bar',
            height: 400,
            background: 'transparent',
            foreColor: isDark ? '#94a3b8' : '#666666',
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 2,
                horizontal: true,
                barHeight: '70%',
                distributed: false,
                dataLabels: { position: 'end' }
            }
        },
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: isDark ? ['#fff'] : ['#000'],
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px'
            },
            formatter: (val) => val.toLocaleString(),
            offsetX: 15
        },
        stroke: { width: 0 },
        grid: {
            borderColor: isDark ? 'rgba(38, 51, 87, 0.3)' : 'rgba(200, 200, 200, 0.2)',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } }
        },
        colors: ['#FF0000'],
        xaxis: {
            categories: [],
            labels: { style: { fontFamily: 'Inter, sans-serif' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { fontWeight: 600, fontSize: '14px', fontFamily: 'Inter, sans-serif' }
            }
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            x: { show: true },
            y: { formatter: (val) => val + ' 篇/次' }
        },
        states: {
            hover: {
                filter: { type: 'darken', value: 0.15 }
            },
            active: {
                filter: { type: 'darken', value: 0.15 }
            }
        }
    };

    const lineOptions = {
        series: [{ name: '發布總量', data: [] }],
        chart: {
            type: 'area',
            height: 400,
            background: 'transparent',
            foreColor: isDark ? '#94a3b8' : '#666666',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        stroke: { curve: 'smooth', width: 3, colors: ['#FF0000'] },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.02,
                stops: [0, 100],
                colorStops: []
            }
        },
        markers: {
            size: 4,
            colors: ['#FF0000'],
            strokeColors: isDark ? '#070913' : '#FFFFFF',
            strokeWidth: 2,
            hover: { size: 6 }
        },
        grid: {
            borderColor: isDark ? 'rgba(38, 51, 87, 0.3)' : 'rgba(200, 200, 200, 0.2)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            type: 'category',
            categories: [],
            labels: {
                show: true,
                hideOverlappingLabels: false,
                minHeight: 30,
                style: {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px'
                },
                offsetY: 5
            },
            axisBorder: { show: false },
            axisTicks: { show: true, length: 4, color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }
        },
        yaxis: {
            labels: { style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }
        },
        colors: ['#FF0000'],
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            x: { format: 'yyyy-MM-dd' },
            y: { formatter: (val) => val + ' 篇/次' }
        }
    };

    barChart = new ApexCharts(document.querySelector("#bar-chart"), barOptions);
    barChart.render();

    // Add click event to bar chart for media selection
    barChart.addEventListener('dataPointSelection', (_e, _chartContext, config) => {
        if (config.dataPointIndex >= 0) {
            const groupInfo = window.dashboardData[currentGroup];
            const topBarData = groupInfo.bar.slice(0, currentTopN);
            const selectedMediaName = topBarData[config.dataPointIndex].media;
            onBarChartClick(selectedMediaName);
        }
    });

    lineChart = new ApexCharts(document.querySelector("#line-chart"), lineOptions);
    lineChart.render();
}

/**
 * Update Bar Chart Based on Current Top N
 */
function updateBarChart() {
    if (!window.dashboardData || !window.dashboardData[currentGroup]) return;

    const groupInfo = window.dashboardData[currentGroup];
    const topBarData = groupInfo.bar.slice(0, currentTopN);
    const barSeriesData = topBarData.map(item => item.count);
    const barCategories = topBarData.map(item => item.media);

    barChart.updateOptions({
        xaxis: { categories: barCategories },
        series: [{
            name: '數據總量',
            data: barSeriesData
        }]
    });
}

/**
 * Update Line Chart for All Data or Specific Media
 */
function updateLineChart(mediaName = null) {
    if (!window.dashboardData || !window.dashboardData[currentGroup]) return;

    const groupInfo = window.dashboardData[currentGroup];
    let lineData;

    if (mediaName && selectedMedia === mediaName) {
        // Show specific media trend
        lineData = groupInfo.mediaTimeSeries?.[mediaName] || groupInfo.line;
        document.getElementById('line-chart-desc').innerText = `${mediaName} 的發布月份趨勢`;
    } else {
        // Show all data trend
        lineData = groupInfo.line;
        document.getElementById('line-chart-desc').innerText = '按發布月份統計每月的發布總量走勢';
        selectedMedia = null;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const lineCategories = lineData.map(item => item.date.substring(0, 7));
    const lineSeriesData = lineData.map(item => item.count);

    lineChart.updateOptions({
        xaxis: {
            type: 'category',
            categories: lineCategories,
            labels: {
                show: true,
                hideOverlappingLabels: false,
                minHeight: 30,
                style: {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px'
                },
                offsetY: 5
            },
            axisBorder: { show: false },
            axisTicks: { show: true, length: 4, color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }
        },
        series: [{
            name: mediaName ? `${mediaName} 發布數` : '發布總量',
            data: lineSeriesData
        }]
    });

    // Update date range (display as YYYY-MM)
    if (lineData.length > 0) {
        const dates = lineData.map(item => item.date.substring(0, 7)).sort();
        document.getElementById('line-chart-date-range').innerText = `${dates[0]} 至 ${dates[dates.length - 1]}`;
    }
}

/**
 * Handle Group Selection
 */
function selectGroup(groupName) {
    if (!window.dashboardData || !window.dashboardData[groupName]) return;

    currentGroup = groupName;
    selectedMedia = null;
    const groupInfo = window.dashboardData[groupName];
    const groupColor = themeColors[groupName];

    document.getElementById('selected-group-badge').innerText = `當前選擇：${groupName}`;
    document.getElementById('bar-chart-total-media').innerText = `${groupInfo.scoreboard.distinct_media} 個不重複來源`;

    const selectorButtons = ['Review', 'News', 'YouTube'];
    selectorButtons.forEach(btnName => {
        const btn = document.getElementById(`btn-${btnName}`);
        if (btn) {
            if (btnName === groupName) {
                btn.classList.add('active');
                btn.style.backgroundColor = groupColor.primary;
                btn.style.boxShadow = `0 0 15px ${groupColor.glow}`;
            } else {
                btn.classList.remove('active');
                btn.style.backgroundColor = '';
                btn.style.boxShadow = '';
            }
        }
    });

    const cards = {
        'Review': document.querySelector('.card-review'),
        'News': document.querySelector('.card-news'),
        'YouTube': document.querySelector('.card-youtube')
    };

    Object.keys(cards).forEach(key => {
        if (cards[key]) {
            if (key === groupName) {
                cards[key].style.borderColor = groupColor.primary;
                cards[key].style.boxShadow = `0 0 25px ${groupColor.glow}`;
            } else {
                cards[key].style.borderColor = '';
                cards[key].style.boxShadow = '';
            }
        }
    });

    updateBarChart();
    updateLineChart();
}

/**
 * Handle Bar Chart Click (Media Selection for Line Chart)
 */
function onBarChartClick(mediaName) {
    selectedMedia = selectedMedia === mediaName ? null : mediaName;
    updateLineChart(mediaName);
}
