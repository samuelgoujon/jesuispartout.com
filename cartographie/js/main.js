let chart, feeds;

// request data using d3.csv and initilize chart when data is loaded
d3.csv('data/dextera_orgs.csv').then(data => {
    let width = document.getElementById('svg-container').getBoundingClientRect().width;
    let height = window.innerHeight - 50;
    chart = initChart(width, height, '#svg-container', data);
})

function initChart(width, height, container, data = []) {
    return renderChart()
        .svgWidth(width)
        .svgHeight(height)
        .container(container)
        .data(data)
        .run();
}