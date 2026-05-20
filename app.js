/**
 * Zapier Dashboard Interactive Core Logic
 * Powered by ApexCharts & Vanilla JavaScript
 * Entire UI elements translated to English
 * Premium Unified Red theme applied to all components
 */

let barChart = null;
let lineChart = null;
let currentGroup = 'Overall'; // Default to Overall
let currentTopN = 15;
let selectedMedia = null;
let currentLineCategories = []; // Global cache to reliably match index to category names

// Premium Unified MSI Red Palette:
// All tabs use unified red (#FF0000) for a clean, high-end branded layout
const themeColors = {
    'Overall': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' },
    'Review': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' },
    'News': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' },
    'YouTube': { primary: '#FF0000', glow: 'rgba(255, 0, 0, 0.25)' }
};

document.addEventListener('DOMContentLoaded', () => {
    generateOverallData(); // Step 1: Calculate dynamic Overall data
    initializeTheme();
    initializeScoreboard();
    initializeCharts();
    initializeParameterControl();
    selectGroup('Overall'); // Default group is Overall!

    const dateSpan = document.getElementById('current-date');
    if (dateSpan) {
        const today = new Date();
        dateSpan.innerText = today.toISOString().split('T')[0];
    }
});

/**
 * Generate Overall aggregated dataset from Review, News, and YouTube dynamically
 */
function generateOverallData() {
    if (!window.dashboardData) return;
    const data = window.dashboardData;

    // 1. Total counts
    const totalReview = data.Review?.scoreboard.total || 0;
    const totalNews = data.News?.scoreboard.total || 0;
    const totalYouTube = data.YouTube?.scoreboard.total || 0;
    const overallTotal = totalReview + totalNews + totalYouTube;

    // 2. Distinct Media
    const allMedia = new Set();
    data.Review?.bar.forEach(item => allMedia.add(item.media));
    data.News?.bar.forEach(item => allMedia.add(item.media));
    data.YouTube?.bar.forEach(item => allMedia.add(item.media));
    const overallDistinctMedia = allMedia.size;

    // 3. Aggregate Bar counts (sum counts for identical media names)
    const mediaCounts = {};
    const collectCounts = (barArray) => {
        if (!barArray) return;
        barArray.forEach(item => {
            mediaCounts[item.media] = (mediaCounts[item.media] || 0) + item.count;
        });
    };
    collectCounts(data.Review?.bar);
    collectCounts(data.News?.bar);
    collectCounts(data.YouTube?.bar);
    const overallBar = Object.keys(mediaCounts).map(media => ({
        media: media,
        count: mediaCounts[media]
    })).sort((a, b) => b.count - a.count);

    // 4. Aggregate Line trends (sum counts for identical months)
    const dateCounts = {};
    const collectLineCounts = (lineArray) => {
        if (!lineArray) return;
        lineArray.forEach(item => {
            dateCounts[item.date] = (dateCounts[item.date] || 0) + item.count;
        });
    };
    collectLineCounts(data.Review?.line);
    collectLineCounts(data.News?.line);
    collectLineCounts(data.YouTube?.line);
    const overallLine = Object.keys(dateCounts).map(date => ({
        date: date,
        count: dateCounts[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Aggregate mediaTimeSeries for click-to-filter support in Overall mode
    const overallMediaTimeSeries = {};
    const collectTimeSeries = (timeSeriesMap) => {
        if (!timeSeriesMap) return;
        Object.keys(timeSeriesMap).forEach(media => {
            if (!overallMediaTimeSeries[media]) {
                overallMediaTimeSeries[media] = {};
            }
            timeSeriesMap[media].forEach(item => {
                overallMediaTimeSeries[media][item.date] = (overallMediaTimeSeries[media][item.date] || 0) + item.count;
            });
        });
    };
    collectTimeSeries(data.Review?.mediaTimeSeries);
    collectTimeSeries(data.News?.mediaTimeSeries);
    collectTimeSeries(data.YouTube?.mediaTimeSeries);

    // Format map-of-maps into sorted arrays
    const formattedMediaTimeSeries = {};
    Object.keys(overallMediaTimeSeries).forEach(media => {
        const datesObj = overallMediaTimeSeries[media];
        formattedMediaTimeSeries[media] = Object.keys(datesObj).map(date => ({
            date: date,
            count: datesObj[date]
        })).sort((a, b) => a.date.localeCompare(b.date));
    });

    // Populate Overall key dynamically!
    data.Overall = {
        scoreboard: {
            total: overallTotal,
            distinct_media: overallDistinctMedia
        },
        bar: overallBar,
        line: overallLine,
        mediaTimeSeries: formattedMediaTimeSeries
    };
}

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

    if (data.Overall) {
        document.getElementById('overall-distinct-media').innerText = data.Overall.scoreboard.distinct_media.toLocaleString();
        document.getElementById('overall-total-count').innerText = data.Overall.scoreboard.total.toLocaleString();
    }

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
        series: [{ name: 'Publishing Volume', data: [] }],
        chart: {
            type: 'bar',
            height: 530, // Dynamic height calculated later, baseline 530px for 15 bars
            stacked: false, // Single unified aggregate count representation
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
                dataLabels: { position: 'top' } // Changed 'end' to 'top' to draw labels OUTSIDE the bar!
            }
        },
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: isDark ? ['#fff'] : ['#000'],
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px'
            },
            formatter: (val) => val > 0 ? val.toLocaleString() : '',
            offsetX: 10 // Elegant offset outside the bar
        },
        stroke: { width: 0 },
        grid: {
            borderColor: isDark ? 'rgba(38, 51, 87, 0.3)' : 'rgba(200, 200, 200, 0.2)',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } }
        },
        colors: ['#FF0000'], // Unified MSI Red theme
        xaxis: {
            categories: [],
            labels: { style: { fontFamily: 'Inter, sans-serif' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { fontWeight: 600, fontSize: '14px', fontFamily: 'Inter, sans-serif' } // Increased by 2px from 12px
            }
        },
        legend: {
            show: false
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            x: { show: true },
            y: { formatter: (val) => val.toLocaleString() + ' items' }
        },
        states: {
            hover: { filter: { type: 'darken', value: 0.15 } },
            active: { filter: { type: 'darken', value: 0.15 } }
        }
    };

    const lineOptions = {
        series: [{ name: 'Publishing Volume', data: [] }],
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
                stops: [0, 100]
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
            labels: { style: { fontFamily: 'Inter, sans-serif', fontSize: '13px' } }
        },
        colors: ['#FF0000'],
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                // Safely resolve monthly string under any date auto-conversion context
                let categoriesArray = [];
                if (w.config && w.config.xaxis && w.config.xaxis.categories) {
                    categoriesArray = w.config.xaxis.categories;
                } else if (w.globals && w.globals.labels) {
                    categoriesArray = w.globals.labels;
                } else if (w.globals && w.globals.categoryHeaders) {
                    categoriesArray = w.globals.categoryHeaders;
                }

                let month = categoriesArray[dataPointIndex] || '';
                
                // Fallback check
                if (!month && window.currentLineCategories) {
                    month = window.currentLineCategories[dataPointIndex] || '';
                }

                // Parse milliseconds timestamp back to standard YYYY-MM
                if (typeof month === 'number' || (typeof month === 'string' && !isNaN(month))) {
                    const parsedDate = new Date(Number(month));
                    if (!isNaN(parsedDate.getTime())) {
                        month = parsedDate.toISOString().substring(0, 7);
                    }
                }

                const total = series[seriesIndex][dataPointIndex];

                // Normalize month helper to guarantee standard "YYYY-MM" formatting matching
                const normalizeMonth = (str) => {
                    if (!str) return '';
                    const s = String(str);
                    if (s.includes('-')) {
                        const parts = s.split('-');
                        if (parts[0].length === 4 && parts[1]) {
                            return `${parts[0]}-${parts[1].padStart(2, '0')}`;
                        }
                    }
                    return s.substring(0, 7);
                };

                const targetNormalized = normalizeMonth(month);

                // Dynamically fetch accurate multi-channel breakdown counts (respects specific media selection!)
                const getCountForMonth = (group, targetMonth) => {
                    if (!window.dashboardData || !window.dashboardData[group]) return 0;
                    
                    if (selectedMedia) {
                        // Fetch specific selected media monthly volumes inside this group!
                        const mediaSeries = window.dashboardData[group].mediaTimeSeries;
                        if (!mediaSeries) return 0;
                        
                        // Case-insensitive match on media name keys
                        const matchedMediaKey = Object.keys(mediaSeries).find(k => k.toLowerCase() === selectedMedia.toLowerCase());
                        if (!matchedMediaKey) return 0;
                        
                        const monthItem = mediaSeries[matchedMediaKey].find(i => normalizeMonth(i.date) === targetMonth);
                        return monthItem ? monthItem.count : 0;
                    } else {
                        // Fetch total monthly volumes inside this group!
                        const item = window.dashboardData[group].line.find(i => normalizeMonth(i.date) === targetMonth);
                        return item ? item.count : 0;
                    }
                };

                const reviewCount = getCountForMonth('Review', targetNormalized);
                const newsCount = getCountForMonth('News', targetNormalized);
                const youtubeCount = getCountForMonth('YouTube', targetNormalized);

                return `
                    <div class="custom-tooltip">
                        <div class="tooltip-header">${month}</div>
                        <div class="tooltip-body">
                            <div class="tooltip-row total-row">
                                <span class="dot" style="background-color: #FF0000;"></span>
                                <span class="label">Total Volume:</span>
                                <span class="value">${total.toLocaleString()}</span>
                            </div>
                            <div class="tooltip-divider"></div>
                            <div class="tooltip-row review-row">
                                <span class="dot" style="background-color: #FF0000;"></span>
                                <span class="label">Reviews:</span>
                                <span class="value">${reviewCount.toLocaleString()}</span>
                            </div>
                            <div class="tooltip-row news-row">
                                <span class="dot" style="background-color: #FF0000;"></span>
                                <span class="label">News:</span>
                                <span class="value">${newsCount.toLocaleString()}</span>
                            </div>
                            <div class="tooltip-row youtube-row">
                                <span class="dot" style="background-color: #FF0000;"></span>
                                <span class="label">YouTube:</span>
                                <span class="value">${youtubeCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
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
 * Includes dynamic height expansion to prevent squeezing!
 */
function updateBarChart() {
    if (!window.dashboardData || !window.dashboardData[currentGroup]) return;

    const data = window.dashboardData;
    const groupInfo = data[currentGroup];
    const topBarData = groupInfo.bar.slice(0, currentTopN);
    const barCategories = topBarData.map(item => item.media);
    const barSeriesData = topBarData.map(item => item.count);

    // Dynamically calculate comfortable height for the horizontal bar chart
    // Base height 80px for headers/spacing, plus 30px per bar. Minimum 350px.
    const dynamicHeight = Math.max(350, 80 + (topBarData.length * 30));

    barChart.updateOptions({
        chart: {
            height: dynamicHeight
        },
        xaxis: { categories: barCategories },
        series: [{
            name: 'Publishing Volume',
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
        document.getElementById('line-chart-desc').innerText = `${mediaName} Monthly Publishing Trend`;
    } else {
        // Show all data trend
        lineData = groupInfo.line;
        document.getElementById('line-chart-desc').innerText = 'Monthly publishing trends by volume';
        selectedMedia = null;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const lineCategories = lineData.map(item => item.date.substring(0, 7));
    
    // Store globally to prevent ApexCharts date auto-format or timestamp parsing from breaking tooltips!
    currentLineCategories = lineCategories;
    window.currentLineCategories = lineCategories; // Set on window object as well to guarantee global visibility!

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
            name: mediaName ? `${mediaName} Volume` : 'Total Volume',
            data: lineSeriesData
        }]
    });

    // Update date range (display as YYYY-MM)
    if (lineData.length > 0) {
        const dates = lineData.map(item => item.date.substring(0, 7)).sort();
        document.getElementById('line-chart-date-range').innerText = `${dates[0]} to ${dates[dates.length - 1]}`;
    } else {
        document.getElementById('line-chart-date-range').innerText = 'N/A';
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

    document.getElementById('selected-group-badge').innerText = `Current Selection: ${groupName}`;
    document.getElementById('bar-chart-total-media').innerText = `${groupInfo.scoreboard.distinct_media} Media Sources`;

    // Update group selector buttons active styles
    const selectorButtons = ['Overall', 'Review', 'News', 'YouTube'];
    selectorButtons.forEach(btnName => {
        const btn = document.getElementById(`btn-${btnName}`);
        if (btn) {
            if (btnName === groupName) {
                btn.classList.add('active');
                btn.style.backgroundColor = groupColor.primary;
                btn.style.boxShadow = `0 0 15px ${groupColor.glow}`;
                btn.style.color = '#FFFFFF'; // High contrast white text on active color
            } else {
                btn.classList.remove('active');
                btn.style.backgroundColor = '';
                btn.style.boxShadow = '';
                btn.style.color = '';
            }
        }
    });

    // Update cards active styles
    const cards = {
        'Overall': document.querySelector('.card-overall'),
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

    // Dynamically update EVERYTHING in line chart to match selected group
    if (lineChart) {
        lineChart.updateOptions({
            colors: [groupColor.primary],
            stroke: { colors: [groupColor.primary] },
            markers: { colors: [groupColor.primary] },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.02,
                    stops: [0, 100]
                }
            }
        });
    }

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
