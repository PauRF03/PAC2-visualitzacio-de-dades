const ROW = 20,
  COL = 300;
const M = { top: 16, right: 150, bottom: 16, left: 90 };
const int = new Intl.NumberFormat("ca");
const mill = new Intl.NumberFormat("ca", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

d3.csv("data/data.csv", d3.autoType)
  .then((rows) => {
    const byRegion = d3
      .rollups(
        rows,
        (v) => v,
        (d) => d.comunitat,
      )
      .map(([name, v]) => ({ name, total: d3.sum(v, (d) => d.poblacio), v }))
      .sort((a, b) => b.total - a.total);
    const tree = {
      name: "Espanya",
      children: byRegion.map((r) => ({
        name: r.name,
        total: r.total,
        children: r.v
          .slice()
          .sort((a, b) => b.poblacio - a.poblacio)
          .map((d) => ({ name: d.provincia, value: d.poblacio })),
      })),
    };
    const root = d3.hierarchy(tree);
    d3.cluster().nodeSize([ROW, COL])(root);

    const radius = d3.scaleSqrt(
      [0, d3.max(root.leaves(), (n) => n.data.value)],
      [0, 10],
    );
    const [x0, x1] = d3.extent(root.descendants(), (n) => n.x);

    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("viewBox", [
        0,
        0,
        M.left + COL * root.height + M.right,
        x1 - x0 + M.top + M.bottom,
      ]);
    const g = svg
      .append("g")
      .attr("transform", `translate(${M.left},${M.top - x0})`)
      .attr("font-size", 12)
      .style("fill", "var(--text, #1f2933)");

    g.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .style("stroke", "var(--grid, #b8c0c9)")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        (l) => `M${l.source.y},${l.source.x}V${l.target.x}H${l.target.y}`,
      );

    const node = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (n) => `translate(${n.y},${n.x})`);
    node
      .append("circle")
      .attr("r", (n) =>
        n.children ? (n.depth ? 3.5 : 5) : Math.max(radius(n.data.value), 1.5),
      )
      .attr("stroke-width", 1.5)
      .style("stroke", "var(--bg, #fff)")
      .style("fill", (n) =>
        n.children ? "var(--text, #1f2933)" : "var(--accent, #2f6fb0)",
      );
    node
      .append("title")
      .text((n) =>
        n.children
          ? `${n.data.name}: ${int.format(n.depth ? n.data.total : d3.sum(rows, (d) => d.poblacio))} habitants`
          : `${n.data.name}: ${int.format(n.data.value)} habitants`,
      );

    node
      .filter((n) => n.depth === 0)
      .append("text")
      .attr("x", -12)
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .text((n) => n.data.name);
    const region = node
      .filter((n) => n.depth === 1)
      .append("text")
      .attr("x", 10 - COL)
      .attr("y", -7)
      .attr("font-size", 13);
    region
      .append("tspan")
      .attr("font-weight", 700)
      .text((n) => n.data.name);
    region
      .append("tspan")
      .attr("dx", 6)
      .style("fill", "var(--muted, #5f6c7b)")
      .text((n) => `${mill.format(n.data.total / 1e6)} M`);
    const leaf = node
      .filter((n) => !n.children)
      .append("text")
      .attr("x", 14)
      .attr("dy", "0.32em");
    leaf.append("tspan").text((n) => n.data.name);
    leaf
      .append("tspan")
      .attr("dx", 6)
      .style("fill", "var(--muted, #5f6c7b)")
      .text((n) => int.format(n.data.value));
  })
  .catch((err) => {
    document
      .getElementById("chart")
      .insertAdjacentHTML(
        "beforeend",
        `<p style="color:#c00">No s'han pogut carregar les dades: ${err.message}. ` +
          `Obre la pàgina amb un servidor local (per exemple, Live Server de VS Code).</p>`,
      );
  });
