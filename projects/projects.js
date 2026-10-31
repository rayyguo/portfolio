import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let query = '';
let selectedIndex = -1;
// The selected wedge's year, so the selection survives the pie being redrawn
let selectedYear = null;

function filterBySearch(projectsGiven) {
  return projectsGiven.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// Apply both the search query and the selected year, then redraw everything
function updatePage() {
  let searchedProjects = filterBySearch(projects);
  renderPieChart(searchedProjects);

  let visibleProjects =
    selectedIndex === -1
      ? searchedProjects
      : searchedProjects.filter((project) => project.year === selectedYear);
  renderProjects(visibleProjects, projectsContainer, 'h2');
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // Keep the selected year highlighted if it's still in the data, else deselect
  selectedIndex = newData.findIndex((d) => d.label === selectedYear);
  if (selectedIndex === -1) {
    selectedYear = null;
  }

  // Clear the previous slices and legend items before redrawing
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  let selectYear = (i) => {
    selectedIndex = selectedIndex === i ? -1 : i;
    selectedYear = selectedIndex === -1 ? null : newData[i].label;
    updatePage();
  };

  newArcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => selectYear(i));
  });

  newData.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectYear(i));
  });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updatePage();
});
