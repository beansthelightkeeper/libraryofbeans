import { getTopSearches, getRecentSearches } from './db.js';

function populateTable(tbodyId, data) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  data.forEach(item => {
    if (item.term && !/^\d+$/.test(item.term)) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.term}</td>
        <td>${item.jewish}</td>
        <td>${item.english}</td>
        <td>${item.simple}</td>
        <td>${item.count}</td>
      `;
      tbody.appendChild(row);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const top = await getTopSearches(10);
  populateTable('top-searches-tbody', top);

  const recent = await getRecentSearches(10);
  populateTable('recent-searches-tbody', recent);
});