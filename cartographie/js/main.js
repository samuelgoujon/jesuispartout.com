let chart, feeds;

// request data using d3.csv and initilize chart when data is loaded
d3.csv('data/dextera_orgs.csv').then(data => {
    let width = document.getElementById('svg-container').getBoundingClientRect().width;
    let height = window.innerHeight - 50;
    chart = initChart(width, height, '#svg-container', data);
})

// get feeds
d3.json('/api/feeds')
  .then(d => {
      feeds = d;
      return buildPanel(d)
  })

function initChart(width, height, container, data = []) {
    return renderChart()
        .svgWidth(width)
        .svgHeight(height)
        .container(container)
        .data(data)
        .run();
}

function buildPanel (data) {
    var container = document.getElementById('panel-items')

    data
      .sort((a, b) => {
          return new Date(b.published) - new Date(a.published)
      })
      .forEach(element => {
          var el = document.createElement('div')
          el.classList.add('event');
          el.classList.add('row');
          el.setAttribute('id', element._id);
          el.innerHTML = `<div class="col-xs-2 icon-holder">
                              <i class="fa fa-rss fa-lg"></i>
                          </div>
                          <div class="col-xs-10 col-xs-offset-2">
                              ${element.title}
                          </div>`
          d3.select(el).on('click', () => viewDetails(element))
          container.appendChild(el)
      });
}

function viewDetails (d) {
    var details = document.getElementById('panel-items-details')
    var container = document.getElementById('events-panel')

    details.classList.remove('hidden')
    container.classList.add('hidden')

    var row = document.createElement('div')
    row.classList.add('details-container')

    let str =  `<div class="title">${d.title}</div>
                <div class="org-name">${d.node}</div>
                <div class="description ${(d.description && d.description.length) ? 'b-bottom padding' : ''}">
                    ${d.image && d.image != '' && !d.description.includes(d.image) ?
                        `<img alt="Preview" class="image" src="${d.image}"/>` : ''}
                    ${(d.description && d.description.length) ? d.description : ''}
                </div>`;

    if (d.link && d.link != '') {
        str += `
                <div class="text-end m-t-15"><a class="btn btn-default" target="_blank" href="${d.link}">PARTICIPER</a></div>
                `
    }

    row.innerHTML = str
    details.appendChild(row)

    if (chart) {
        chart.panToCenter(d.node)
    }
}

function showAllFeeds () {
    var details = document.getElementById('panel-items-details')
    var container = document.getElementById('events-panel')

    container.classList.remove('hidden')
    details.classList.add('hidden')

    var rows = details.getElementsByClassName('details-container')
    for(let i = 0; i < rows.length; i++) {
        details.removeChild(rows[i])
    }

    chart.resetZoom();
}

function search (e) {
    var value = e.target.value.trim();
    if (value == '' || value.length < 2) {
        d3.selectAll('.event').classed('hidden', false)
        return;
    }
    var keywords = value.split(' ')
                        .filter(x => x.length)
                        .map(x => x.toLowerCase());
    let filteredFeeds = feeds.filter(x =>
        keywords.filter(keyword => match(x.title.toLowerCase(), keyword)).length
    )
    d3.selectAll('.event').classed('hidden', true)
    filteredFeeds.forEach(x => {
        document.getElementById(x._id).classList.remove('hidden')
    })
}

function match (str, keyword) {
    var r = new RegExp(`\\b${keyword}\\b`)
    return r.test(str)
  }
