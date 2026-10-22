const DATA_FILE = "data/data.csv";
const DEFAULT_YEAR = 2024;

function ensure(id, tag, parent) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement(tag);
    node.id = id;
    parent.appendChild(node);
  }
  return node;
}

const chartDiv = ensure("chart", "div", document.body);
const insightEl = ensure("insight", "p", document.body);
let yearSelect = document.getElementById("year");
if (!yearSelect) {
  yearSelect = document.createElement("select");
  yearSelect.id = "year";
  document.body.insertBefore(yearSelect, chartDiv);
}

function showError(msg) {
  chartDiv.insertAdjacentHTML("beforeend", `<p style="color:#c00">${msg}</p>`);
}

if (typeof d3 === "undefined") {
  showError(
    "No s'ha carregat D3. Comprova la connexió i que l'index.html inclogui " +
      '&lt;script src="https://cdn.jsdelivr.net/npm/d3@7"&gt;&lt;/script&gt; abans de chart.js.',
  );
  throw new Error("D3 no està carregat");
}

const size = 720;
const innerRadius = 36;
const outerRadius = 270;
const labelRadius = 298;
const maxValue = 18;

const rootStyle = getComputedStyle(document.documentElement);
const cssVar = (name, fallback) =>
  rootStyle.getPropertyValue(name).trim() || fallback;

const COLORS = {
  tourists: cssVar("--tourists", "#b23a1f"),
  excursionists: cssVar("--excursionists", "#f0b27a"),
  grid: cssVar("--grid", "#d9dee4"),
  text: cssVar("--text", "#1f2933"),
  muted: cssVar("--muted", "#5f6c7b"),
};

const fmt1 = new Intl.NumberFormat("ca", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const fmt0 = new Intl.NumberFormat("ca", { maximumFractionDigits: 0 });

const svg = d3
  .select(chartDiv)
  .append("svg")
  .attr("viewBox", [-size / 2, -size / 2, size, size])
  .attr("width", "100%")
  .style("display", "block")
  .style("max-width", "720px")
  .style("margin", "0 auto")
  .style(
    "font-family",
    "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  );

function polar(angle, radius) {
  // angle 0 = dalt, sentit horari
  return [Math.sin(angle) * radius, -Math.cos(angle) * radius];
}

const mesos = {
  Jan: [1, "Gener"],
  Feb: [2, "Febrer"],
  Mar: [3, "Març"],
  Apr: [4, "Abril"],
  May: [5, "Maig"],
  Jun: [6, "Juny"],
  Jul: [7, "Juliol"],
  Aug: [8, "Agost"],
  Sep: [9, "Setembre"],
  Oct: [10, "Octubre"],
  Nov: [11, "Novembre"],
  Dec: [12, "Desembre"],
};

function parseRows(raw) {
  const labelCol = raw.columns[0];
  return raw.map((d) => {
    const m = String(d[labelCol])
      .trim()
      .match(/^([A-Za-z]{3})\W*(\d{2}|\d{4})$/);
    if (!m || !mesos[m[1]])
      throw new Error(`Etiqueta de mes no reconeguda: "${d[labelCol]}"`);
    return {
      any: m[2].length === 2 ? 2000 + +m[2] : +m[2],
      mes_num: mesos[m[1]][0],
      mes: mesos[m[1]][1],
      turistes_milers: +d.Tourists,
      excursionistes_milers: +d.Excursionists,
    };
  });
}

function draw(rows, year) {
  svg.selectAll("*").remove();

  const data = rows
    .filter((d) => d.any === year)
    .map((d) => ({
      num: d.mes_num,
      mes: d.mes,
      turistes: d.turistes_milers / 1000,
      excursionistes: d.excursionistes_milers / 1000,
      total: (d.turistes_milers + d.excursionistes_milers) / 1000,
    }));

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.num))
    .range([0, 2 * Math.PI])
    .align(0);

  const y = d3
    .scaleRadial()
    .domain([0, maxValue])
    .range([innerRadius, outerRadius]);

  const ticks = [5, 10, 15];
  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", COLORS.grid)
    .selectAll("circle")
    .data(ticks)
    .join("circle")
    .attr("r", (d) => y(d));

  const segments = data.flatMap((d) => [
    { d, tipus: "Turistes", y0: 0, y1: d.turistes, color: COLORS.tourists },
    {
      d,
      tipus: "Excursionistes",
      y0: d.turistes,
      y1: d.total,
      color: COLORS.excursionists,
    },
  ]);

  const arc = d3
    .arc()
    .innerRadius((s) => y(s.y0))
    .outerRadius((s) => y(s.y1))
    .startAngle((s) => x(s.d.num))
    .endAngle((s) => x(s.d.num) + x.bandwidth())
    .padAngle(0.012)
    .padRadius(innerRadius);

  svg
    .append("g")
    .selectAll("path")
    .data(segments)
    .join("path")
    .attr("d", arc)
    .attr("fill", (s) => s.color)
    .append("title")
    .text(
      (s) =>
        `${s.d.mes} ${year} · ${s.tipus}: ${fmt1.format(s.y1 - s.y0)} milions (total del mes: ${fmt1.format(s.d.total)})`,
    );

  svg
    .append("g")
    .attr("font-size", 11)
    .attr("fill", COLORS.muted)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(ticks)
    .join("text")
    .attr("y", (d) => -y(d) - 3)
    .text((d) => `${d} M`);

  svg
    .append("g")
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("fill", COLORS.text)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("transform", (d) => {
      const [px, py] = polar(x(d.num) + x.bandwidth() / 2, y(d.total) + 11);
      return `translate(${px},${py})`;
    })
    .attr("dy", "0.32em")
    .text((d) => fmt1.format(d.total));

  // Noms dels mesos
  svg
    .append("g")
    .attr("font-size", 13)
    .attr("fill", COLORS.text)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("transform", (d) => {
      const [px, py] = polar(x(d.num) + x.bandwidth() / 2, labelRadius);
      return `translate(${px},${py})`;
    })
    .attr("dy", "0.32em")
    .text((d) => d.mes);

  // Llegenda dins del SVG (només si la pàgina no en porta una)
  if (!document.querySelector(".legend")) {
    const legend = svg
      .append("g")
      .attr("font-size", 13)
      .attr("fill", COLORS.text)
      .attr("transform", `translate(${-size / 2 + 12},${size / 2 - 44})`);
    [
      ["Turistes", COLORS.tourists],
      ["Excursionistes", COLORS.excursionists],
    ].forEach(([nom, color], i) => {
      const g = legend.append("g").attr("transform", `translate(0,${i * 20})`);
      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", color);
      g.append("text").attr("x", 18).attr("y", 10).text(nom);
    });
  }
}

function start(rows) {
  const years = Array.from(new Set(rows.map((d) => d.any))).sort(d3.ascending);
  yearSelect.innerHTML = "";
  years.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === DEFAULT_YEAR) opt.selected = true;
    yearSelect.appendChild(opt);
  });
  yearSelect.addEventListener("change", () => draw(rows, +yearSelect.value));
  draw(
    rows,
    years.includes(DEFAULT_YEAR) ? DEFAULT_YEAR : years[years.length - 1],
  );
}

d3.csv(DATA_FILE)
  .then((raw) => {
    if (
      !raw.columns.includes("Tourists") ||
      !raw.columns.includes("Excursionists")
    ) {
      throw new Error(
        `El fitxer ${DATA_FILE} no té les columnes Tourists i Excursionists`,
      );
    }
    return raw;
  })
  .catch((err) => {
    console.warn(
      `No s'ha pogut usar ${DATA_FILE} (${err.message}). S'usen les dades incorporades.`,
    );
    return d3.csvParse(FALLBACK_CSV);
  })
  .then((raw) => start(parseRows(raw)))
  .catch((err) =>
    showError(`No s'ha pogut dibuixar el gràfic: ${err.message}`),
  );
